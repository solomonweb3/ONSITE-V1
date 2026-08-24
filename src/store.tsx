import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BadgeStatus } from './components/ui';
import { supabase } from './lib/supabase';
import * as api from './data/api';
import { SEED_ACTIVATIONS, SEED_NOTIFICATIONS } from './data/seeds';

export type AuthResult = { error?: string; needsConfirm?: boolean };
export type MediaFile = { uri: string; ext: string; contentType: string; label: string; remote?: boolean };

// Built-in demo login that works offline for both paths, independent of the
// Supabase email-confirmation setting. Real provisioned accounts use Supabase.
const DEMO_EMAIL = 'demo@onsite.app';
const DEMO_PASSWORD = 'onsite123';

function localNotifications() {
  return SEED_NOTIFICATIONS.map(([title, body, h], i) => ({
    id: `n${i}`,
    title,
    body,
    time: h >= 24 ? `${Math.round(h / 24)}d ago` : `${h}h ago`,
    unread: h < 24,
  }));
}

/* --------------------------------- Types ---------------------------------- */

export type ItemOwner = 'client' | 'my';
export type ItemState = 'todo' | 'submitted' | 'approved' | 'rejected';

export type ChecklistItem = {
  id: string;
  title: string;
  owner: ItemOwner;
  due: string; // e.g. "6:00 PM"
  state: ItemState;
  caption?: string;
  photoLabel?: string; // filename / link shown in the UI
  mediaUri?: string; // displayable media URL (local file uri in demo, Storage URL when live)
  rejectReason?: string;
};

export type Activation = {
  id: string;
  title: string;
  subtitle: string;
  status: BadgeStatus;
  items: ChecklistItem[];
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  liveActivations: number;
};

export type PendingRequest = { id: string; name: string; initials: string };

export type User = {
  name: string;
  handle: string;
  phone: string;
  role: 'creator' | 'team';
  initials: string;
  bio: string;
  location: string;
  followers: string;
  profileComplete: boolean;
};

/* --------------------------------- Seed ----------------------------------- */

const seedTeam: TeamMember[] = [
  { id: 'm1', name: 'Ariana Ford', initials: 'AF', liveActivations: 3 },
  { id: 'm2', name: 'Sam Whitmore', initials: 'SW', liveActivations: 1 },
  { id: 'm3', name: 'Jules Park', initials: 'JP', liveActivations: 0 },
];

const seedPending: PendingRequest[] = [
  { id: 'p1', name: 'Maya Chen', initials: 'MC' },
  { id: 'p2', name: 'Devon Ruiz', initials: 'DR' },
];

const TEAM_NAME = 'Solomon Talent';

const seedUser: User = {
  name: 'Gavin Solomon',
  handle: '@solomon',
  phone: '+1 (415) 555-0132',
  role: 'creator',
  initials: 'GS',
  bio: 'On-site content creator. Live brand activations, pop-ups & launches.',
  location: 'Los Angeles, CA',
  followers: '48.2k',
  profileComplete: false,
};

/* -------------------------------- Context --------------------------------- */

type Store = {
  user: User;
  activations: Activation[];
  notifications: AppNotification[];
  team: TeamMember[];
  pending: PendingRequest[];
  teamName: string;
  authed: boolean;
  authLoading: boolean;
  // derived
  liveCount: number;
  completedCount: number;
  unreadCount: number;
  progressOf: (id: string) => number;
  activation: (id: string) => Activation | undefined;
  // auth
  setRole: (role: 'creator' | 'team') => void;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  sendPhoneCode: (phone: string) => Promise<AuthResult>;
  verifyPhoneCode: (phone: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  // actions
  completeProfile: () => void;
  createActivation: (input: api.NewActivationInput) => Promise<string>;
  submitItem: (activationId: string, itemId: string, caption: string, photoLabel: string, mediaUri?: string) => void;
  uploadAndSubmit: (activationId: string, itemId: string, caption: string, file: MediaFile) => Promise<void>;
  approveItem: (activationId: string, itemId: string) => void;
  rejectItem: (activationId: string, itemId: string, reason: string) => void;
  toggleMyItem: (activationId: string, itemId: string) => void;
  markAllRead: () => void;
  resolveRequest: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(seedUser);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [team] = useState<TeamMember[]>(seedTeam);
  const [pending, setPending] = useState<PendingRequest[]>(seedPending);
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const roleRef = React.useRef<'creator' | 'team'>('creator');

  // Track the real Supabase auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // When a session exists: hydrate the profile, then load (or seed) the
  // user's activations + notifications from Supabase. On sign-out, clear.
  useEffect(() => {
    if (demoMode && !session) {
      // Offline demo data — no Supabase round-trip.
      setActivations(SEED_ACTIVATIONS);
      setNotifications(localNotifications());
      setUser((u) => ({ ...u, role: roleRef.current }));
      return;
    }
    if (!session) {
      setActivations([]);
      setNotifications([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const uid = session.user.id;
      try {
        const profile = await api.hydrateProfile(uid, roleRef.current, session.user.email);
        if (!cancelled && profile) {
          setUser((u) => ({
            ...u,
            name: profile.name || u.name,
            handle: profile.handle || u.handle,
            phone: profile.phone || u.phone,
            role: (profile.role as 'creator' | 'team') || roleRef.current,
            profileComplete: profile.profile_complete ?? u.profileComplete,
          }));
        }
        const { activations: acts, notifications: notifs } = await api.bootstrapUserData(uid);
        if (!cancelled) {
          setActivations(acts);
          setNotifications(notifs);
        }
      } catch (e) {
        console.warn('[store] data load failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, demoMode]);

  const authed = !!session || demoMode;
  const uid = session?.user.id;

  const progressOf = useCallback(
    (id: string) => {
      const a = activations.find((x) => x.id === id);
      if (!a || a.items.length === 0) return 0;
      const done = a.items.filter((i) => i.state === 'approved').length;
      return Math.round((done / a.items.length) * 100);
    },
    [activations],
  );

  const updateItem = useCallback(
    (activationId: string, itemId: string, patch: Partial<ChecklistItem>) => {
      setActivations((prev) =>
        prev.map((a) =>
          a.id !== activationId ? a : { ...a, items: a.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) },
        ),
      );
    },
    [],
  );

  const value = useMemo<Store>(
    () => ({
      user,
      activations,
      notifications,
      team,
      pending,
      teamName: TEAM_NAME,
      authed,
      authLoading,
      liveCount: activations.filter((a) => a.status === 'Live').length,
      completedCount: activations.filter((a) => a.status === 'Completed' || a.status === 'Paid').length,
      unreadCount: notifications.filter((n) => n.unread).length,
      progressOf,
      activation: (id: string) => activations.find((a) => a.id === id),
      setRole: (role) => {
        roleRef.current = role;
        setUser((u) => ({ ...u, role }));
      },
      signUpWithEmail: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) return { error: error.message };
        // If email confirmation is on, there's no session until they confirm.
        return { needsConfirm: !data.session };
      },
      signInWithEmail: async (email, password) => {
        // Built-in demo account: works for both "creating" and "joining" a team.
        if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
          setDemoMode(true);
          return {};
        }
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? { error: error.message } : {};
      },
      sendPhoneCode: async (phone) => {
        const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
        return error ? { error: error.message } : {};
      },
      verifyPhoneCode: async (phone, token) => {
        const { error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: token.trim(), type: 'sms' });
        return error ? { error: error.message } : {};
      },
      signOut: async () => {
        setDemoMode(false);
        await supabase.auth.signOut();
      },
      completeProfile: () => {
        setUser((u) => ({ ...u, profileComplete: true }));
        if (session) supabase.from('profiles').update({ profile_complete: true }).eq('id', session.user.id).then(() => {});
      },
      createActivation: async (input) => {
        if (session) {
          const created = await api.createActivationRemote(session.user.id, input);
          setActivations((prev) => [created, ...prev]);
          return created.id;
        }
        // Demo / offline: keep it local.
        const id = 'local-' + Date.now();
        setActivations((prev) => [
          {
            id,
            title: input.title,
            subtitle: input.subtitle,
            status: input.status,
            items: input.items.map((it, i) => ({ id: `${id}-i${i}`, title: it.title, owner: it.owner, due: it.due, state: 'todo' as const })),
          },
          ...prev,
        ]);
        return id;
      },
      submitItem: (activationId, itemId, caption, photoLabel, mediaUri) => {
        updateItem(activationId, itemId, { state: 'submitted', caption, photoLabel, mediaUri, rejectReason: undefined });
        if (session) api.submitItemRemote(itemId, caption, photoLabel, mediaUri).catch((e) => console.warn('[store] submit failed', e));
      },
      uploadAndSubmit: async (activationId, itemId, caption, file) => {
        let mediaUri = file.uri;
        // A pasted link is already a URL; captured files upload to Storage when live.
        if (!file.remote && session) {
          try {
            mediaUri = await api.uploadContent(session.user.id, file.uri, file.ext, file.contentType);
          } catch (e) {
            console.warn('[store] upload failed, keeping local uri', e);
          }
        }
        updateItem(activationId, itemId, { state: 'submitted', caption, photoLabel: file.label, mediaUri, rejectReason: undefined });
        if (session) api.submitItemRemote(itemId, caption, file.label, mediaUri).catch((e) => console.warn('[store] submit failed', e));
      },
      approveItem: (activationId, itemId) => {
        updateItem(activationId, itemId, { state: 'approved' });
        if (session) api.setItemStateRemote(itemId, 'approved').catch((e) => console.warn('[store] approve failed', e));
      },
      rejectItem: (activationId, itemId, reason) => {
        updateItem(activationId, itemId, { state: 'rejected', rejectReason: reason });
        if (session) api.setItemStateRemote(itemId, 'rejected', reason).catch((e) => console.warn('[store] reject failed', e));
      },
      toggleMyItem: (activationId, itemId) => {
        const current = activations.find((a) => a.id === activationId)?.items.find((i) => i.id === itemId);
        const next: ChecklistItem['state'] = current?.state === 'approved' ? 'todo' : 'approved';
        setActivations((prev) =>
          prev.map((a) =>
            a.id !== activationId ? a : { ...a, items: a.items.map((i) => (i.id === itemId ? { ...i, state: next } : i)) },
          ),
        );
        if (session) api.setItemStateRemote(itemId, next).catch((e) => console.warn('[store] toggle failed', e));
      },
      markAllRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
        if (uid) api.markAllReadRemote(uid).catch((e) => console.warn('[store] markRead failed', e));
      },
      resolveRequest: (id) => setPending((prev) => prev.filter((p) => p.id !== id)),
    }),
    [user, activations, notifications, team, pending, authed, authLoading, session, demoMode, uid, progressOf, updateItem],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BadgeStatus } from './components/ui';
import { supabase } from './lib/supabase';
import * as api from './data/api';

export type AuthResult = { error?: string; needsConfirm?: boolean };
export type MediaFile = { uri: string; ext: string; contentType: string; label: string; remote?: boolean };

// Built-in demo login that works offline as a fallback if real auth is down.
const DEMO_EMAIL = 'demo@onsite.app';
const DEMO_PASSWORD = 'onsite123';

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

export type Invite = { id: string; name: string; email: string; code: string };

function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function initialsOf(name: string) {
  return name.trim().split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
}

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
  invites: Invite[];
  teamName: string;
  myTeam: { id: string; name: string } | null;
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
  inviteMember: (name: string, email: string) => Promise<Invite>;
  revokeInvite: (id: string) => void;
  renameTeam: (name: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(seedUser);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [myTeam, setMyTeam] = useState<{ id: string; name: string } | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const roleRef = React.useRef<'creator' | 'team'>('creator');
  const justLoggedInRef = React.useRef(false);

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
      // Offline fallback — start empty, mock team for the demo showcase.
      setActivations([]);
      setNotifications([]);
      setUser((u) => ({ ...u, role: roleRef.current }));
      setMyTeam({ id: 'demo', name: TEAM_NAME });
      setTeam(roleRef.current === 'team' ? seedTeam : []);
      setPending(roleRef.current === 'team' ? seedPending : []);
      return;
    }
    if (!session) {
      setActivations([]);
      setNotifications([]);
      setMyTeam(null);
      setTeam([]);
      setPending([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const uid = session.user.id;
      try {
        // Only stamp the chosen role on a fresh login; keep the persisted role on reload.
        const fresh = justLoggedInRef.current;
        justLoggedInRef.current = false;
        const profile = await api.hydrateProfile(uid, session.user.email, fresh ? roleRef.current : undefined);
        if (!cancelled && profile) {
          setUser((u) => {
            const name = profile.name || u.name;
            return {
              ...u,
              name,
              handle: profile.handle || u.handle,
              phone: profile.phone || u.phone,
              initials: initialsOf(name),
              role: (profile.role as 'creator' | 'team') || roleRef.current,
              profileComplete: profile.profile_complete ?? u.profileComplete,
            };
          });
        }
        const { activations: acts, notifications: notifs } = await api.bootstrapUserData(uid);
        if (!cancelled) {
          setActivations(acts);
          setNotifications(notifs);
        }
        try {
          const invs = await api.loadInvites(uid);
          if (!cancelled) setInvites(invs);
        } catch {
          // invites table may not exist yet — ignore
        }
        // Real team membership.
        try {
          const effectiveRole = (profile?.role as 'creator' | 'team') || roleRef.current;
          const ownerName = profile?.name || session.user.email?.split('@')[0] || '';
          if (effectiveRole === 'team') {
            const t = await api.ensureOwnerTeam(uid, ownerName);
            if (!cancelled) setMyTeam(t);
            const { approved, pending: pend } = await api.loadRoster(t.id);
            if (!cancelled) {
              setTeam(approved);
              setPending(pend.map((p) => ({ id: p.id, name: p.name, initials: p.initials })));
            }
          } else {
            const t = await api.loadMemberTeam(uid);
            if (!cancelled) {
              setMyTeam(t);
              setTeam([]);
              setPending([]);
            }
          }
        } catch (e) {
          console.warn('[store] team load failed', e);
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
      invites,
      teamName: myTeam?.name ?? TEAM_NAME,
      myTeam,
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
        if (data.session) justLoggedInRef.current = true;
        // If email confirmation is on, there's no session until they confirm.
        return { needsConfirm: !data.session };
      },
      signInWithEmail: async (email, password) => {
        // Try the real Supabase account first.
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (!error) {
          justLoggedInRef.current = true;
          return {};
        }
        // Fallback: built-in demo works offline if real auth is unavailable.
        if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
          justLoggedInRef.current = true;
          setDemoMode(true);
          return {};
        }
        return { error: error.message };
      },
      sendPhoneCode: async (phone) => {
        const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
        return error ? { error: error.message } : {};
      },
      verifyPhoneCode: async (phone, token) => {
        const { error } = await supabase.auth.verifyOtp({ phone: phone.trim(), token: token.trim(), type: 'sms' });
        if (!error) justLoggedInRef.current = true;
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
          // Link to the member's team so team owners can see it (via RLS).
          const created = await api.createActivationRemote(session.user.id, input, myTeam?.id);
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
      inviteMember: async (name, email) => {
        // Live: provision a real member login, linked to this owner's team.
        if (session) {
          const res = await api.inviteMemberRemote(name.trim(), email.trim(), myTeam?.id);
          const invite: Invite = { id: 'inv-' + Date.now(), name: name.trim(), email: res.email, code: res.tempPassword };
          setInvites((prev) => [invite, ...prev]);
          // Refresh the roster so the new member appears.
          if (myTeam) {
            api.loadRoster(myTeam.id).then(({ approved }) => setTeam(approved)).catch(() => {});
          }
          return invite;
        }
        // Demo: local invite code.
        const invite: Invite = { id: 'inv-' + Date.now(), name: name.trim(), email: email.trim(), code: makeCode() };
        setInvites((prev) => [invite, ...prev]);
        return invite;
      },
      revokeInvite: (id) => setInvites((prev) => prev.filter((i) => i.id !== id)),
      renameTeam: async (name) => {
        if (!myTeam) return;
        setMyTeam({ ...myTeam, name });
        if (session) await api.updateTeamName(myTeam.id, name).catch(() => {});
      },
    }),
    [user, activations, notifications, team, pending, invites, myTeam, authed, authLoading, session, demoMode, uid, progressOf, updateItem],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

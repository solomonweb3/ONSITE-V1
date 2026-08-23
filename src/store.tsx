import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BadgeStatus } from './components/ui';
import { supabase } from './lib/supabase';

export type AuthResult = { error?: string; needsConfirm?: boolean };

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
  photoLabel?: string; // stand-in for captured media
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

const seedActivations: Activation[] = [
  {
    id: 'a1',
    title: 'Ledger Sunglasses',
    subtitle: 'Summer Pop-Up · Venice Beach',
    status: 'Live',
    items: [
      { id: 'i1', title: '1x Instagram Reel', owner: 'client', due: '6:00 PM', state: 'approved', caption: 'Golden hour try-on at the pop-up.', photoLabel: 'REEL_0612.mp4' },
      { id: 'i2', title: '2x TikTok Posts', owner: 'client', due: '8:00 PM', state: 'submitted', caption: 'Two-part unboxing + street style.', photoLabel: 'TIKTOK_02.mov' },
      { id: 'i3', title: '1x Instagram Story Set', owner: 'my', due: '9:00 PM', state: 'todo' },
      { id: 'i4', title: '1x Product Flatlay', owner: 'client', due: '5:00 PM', state: 'approved', caption: 'Flatlay on the boardwalk.', photoLabel: 'FLATLAY_11.jpg' },
      { id: 'i5', title: '1x Behind-the-scenes clip', owner: 'client', due: '7:30 PM', state: 'todo' },
    ],
  },
  {
    id: 'a2',
    title: 'Alta Coffee',
    subtitle: 'Brand Activation · Coachella',
    status: 'Live',
    items: [
      { id: 'i6', title: '1x Instagram Reel', owner: 'client', due: '2:00 PM', state: 'submitted', caption: 'Cold brew in the desert.', photoLabel: 'ALTA_REEL.mp4' },
      { id: 'i7', title: '3x Story Frames', owner: 'client', due: '4:00 PM', state: 'todo' },
      { id: 'i8', title: '1x Feed Post', owner: 'my', due: '6:00 PM', state: 'todo' },
    ],
  },
  {
    id: 'a3',
    title: 'Northline Apparel',
    subtitle: 'Launch Event',
    status: 'Completed',
    items: [
      { id: 'i9', title: '1x Launch Recap Reel', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Recap of the launch night.', photoLabel: 'RECAP.mp4' },
      { id: 'i10', title: '2x Feed Posts', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Fit checks from the floor.', photoLabel: 'FIT_02.jpg' },
    ],
  },
];

const seedNotifications: AppNotification[] = [
  { id: 'n1', title: 'Activation approved', body: 'Ledger Sunglasses approved all your content', time: '2h ago', unread: true },
  { id: 'n2', title: 'Item due soon', body: '1x TikTok Post due in 15 min', time: '3h ago', unread: true },
  { id: 'n3', title: 'Activation created', body: 'Alta Coffee activation is live', time: '1d ago', unread: false },
];

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
  submitItem: (activationId: string, itemId: string, caption: string, photoLabel: string) => void;
  approveItem: (activationId: string, itemId: string) => void;
  rejectItem: (activationId: string, itemId: string, reason: string) => void;
  toggleMyItem: (activationId: string, itemId: string) => void;
  markAllRead: () => void;
  resolveRequest: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(seedUser);
  const [activations, setActivations] = useState<Activation[]>(seedActivations);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [team] = useState<TeamMember[]>(seedTeam);
  const [pending, setPending] = useState<PendingRequest[]>(seedPending);
  const [session, setSession] = useState<Session | null>(null);
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

  // When a session exists, hydrate the profile row (name/handle/role) and
  // persist the account kind chosen on the AccountKind screen.
  useEffect(() => {
    if (!session) return;
    (async () => {
      const uid = session.user.id;
      await supabase.from('profiles').update({ role: roleRef.current }).eq('id', uid);
      const { data } = await supabase.from('profiles').select('name, handle, phone, role, profile_complete').eq('id', uid).single();
      if (data) {
        setUser((u) => ({
          ...u,
          name: data.name || u.name,
          handle: data.handle || u.handle,
          phone: data.phone || u.phone,
          role: (data.role as 'creator' | 'team') || roleRef.current,
          profileComplete: data.profile_complete ?? u.profileComplete,
        }));
      } else {
        setUser((u) => ({ ...u, role: roleRef.current }));
      }
    })();
  }, [session]);

  const authed = !!session;

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
        await supabase.auth.signOut();
      },
      completeProfile: () => {
        setUser((u) => ({ ...u, profileComplete: true }));
        if (session) supabase.from('profiles').update({ profile_complete: true }).eq('id', session.user.id).then(() => {});
      },
      submitItem: (activationId, itemId, caption, photoLabel) =>
        updateItem(activationId, itemId, { state: 'submitted', caption, photoLabel, rejectReason: undefined }),
      approveItem: (activationId, itemId) => updateItem(activationId, itemId, { state: 'approved' }),
      rejectItem: (activationId, itemId, reason) => updateItem(activationId, itemId, { state: 'rejected', rejectReason: reason }),
      toggleMyItem: (activationId, itemId) =>
        setActivations((prev) =>
          prev.map((a) =>
            a.id !== activationId
              ? a
              : {
                  ...a,
                  items: a.items.map((i) =>
                    i.id === itemId ? { ...i, state: i.state === 'approved' ? 'todo' : 'approved' } : i,
                  ),
                },
          ),
        ),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false }))),
      resolveRequest: (id) => setPending((prev) => prev.filter((p) => p.id !== id)),
    }),
    [user, activations, notifications, team, pending, authed, authLoading, session, progressOf, updateItem],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

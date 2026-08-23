import type { Activation, AppNotification } from '../store';

// Demo content inserted into a brand-new user's tables on first sign-in,
// so the app has something to show. IDs here are placeholders — the database
// assigns real UUIDs on insert, and the app reloads with those.
export const SEED_ACTIVATIONS: Activation[] = [
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

// [title, body, hoursAgo]
export const SEED_NOTIFICATIONS: Array<[string, string, number]> = [
  ['Activation approved', 'Ledger Sunglasses approved all your content', 2],
  ['Item due soon', '1x TikTok Post due in 15 min', 3],
  ['Activation created', 'Alta Coffee activation is live', 24],
];

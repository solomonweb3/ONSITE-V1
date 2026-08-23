import type { Activation } from '../store';

// Activations owned by each team member, with real checklist items so the
// admin view can show uploads + progress. Keyed by team member id.
export const MEMBER_ACTIVATIONS: Record<string, Activation[]> = {
  m1: [
    {
      id: 'ta1',
      title: 'Rove Skincare',
      subtitle: 'Product Launch · Malibu',
      status: 'Live',
      items: [
        { id: 't1a', title: '1x Launch Reel', owner: 'client', due: '5:00 PM', state: 'approved', caption: 'Morning routine at the Malibu house.', photoLabel: 'ROVE_REEL.mp4' },
        { id: 't1b', title: '3x Story Frames', owner: 'client', due: '6:30 PM', state: 'submitted', caption: 'Behind-the-scenes product setup.', photoLabel: 'ROVE_STORY_03.jpg' },
        { id: 't1c', title: '1x Product Demo', owner: 'client', due: '7:00 PM', state: 'approved', caption: 'Close-up of the serum texture.', photoLabel: 'DEMO_04.mp4' },
        { id: 't1d', title: '1x Feed Post', owner: 'my', due: '8:00 PM', state: 'todo' },
      ],
    },
    {
      id: 'ta2',
      title: 'Northline Apparel',
      subtitle: 'Launch Event',
      status: 'Completed',
      items: [
        { id: 't2a', title: '1x Recap Reel', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Recap of the launch night.', photoLabel: 'RECAP.mp4' },
        { id: 't2b', title: '2x Feed Posts', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Fit checks from the floor.', photoLabel: 'FIT_02.jpg' },
      ],
    },
  ],
  m2: [
    {
      id: 'ta3',
      title: 'Alta Coffee',
      subtitle: 'Brand Activation · Coachella',
      status: 'Live',
      items: [
        { id: 't3a', title: '1x Instagram Reel', owner: 'client', due: '2:00 PM', state: 'submitted', caption: 'Cold brew in the desert.', photoLabel: 'ALTA_REEL.mp4' },
        { id: 't3b', title: '3x Story Frames', owner: 'client', due: '4:00 PM', state: 'todo' },
      ],
    },
  ],
  m3: [
    {
      id: 'ta4',
      title: 'Ledger Sunglasses',
      subtitle: 'Summer Pop-Up · Venice Beach',
      status: 'Completed',
      items: [
        { id: 't4a', title: '1x Instagram Reel', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Golden hour try-on.', photoLabel: 'REEL_0612.mp4' },
        { id: 't4b', title: '1x Product Flatlay', owner: 'client', due: 'Delivered', state: 'approved', caption: 'Flatlay on the boardwalk.', photoLabel: 'FLATLAY_11.jpg' },
      ],
    },
  ],
};

export function memberActivationsFor(memberId: string): Activation[] {
  return MEMBER_ACTIVATIONS[memberId] ?? [];
}

export function findMemberActivation(activationId: string): Activation | undefined {
  return Object.values(MEMBER_ACTIVATIONS).flat().find((a) => a.id === activationId);
}

export function activationProgress(a: Activation): number {
  if (a.items.length === 0) return 0;
  const done = a.items.filter((i) => i.state === 'approved').length;
  return Math.round((done / a.items.length) * 100);
}

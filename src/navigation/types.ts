export type AuthStackParams = {
  Landing: undefined;
  AccountKind: undefined;
  TeamAuth: undefined;
};

export type HomeStackParams = {
  Home: undefined;
  NewActivation: undefined;
  Checklist: { activationId: string };
  ItemDetail: { activationId: string; itemId: string };
  AllComplete: { activationId: string };
  BrandPreview: { activationId: string };
  BrandReviewItem: { activationId: string; itemId: string };
  RejectReason: { activationId: string; itemId: string };
};

export type ProfileStackParams = {
  Profile: undefined;
  Account: undefined;
  Notifications: undefined;
  CompleteProfile: undefined;
};

export type TeamStackParams = {
  TeamHome: undefined;
  TeamMemberView: { memberId: string };
  TeamActivationDetail: { activationId: string; memberName: string };
  TeamSettings: undefined;
};

export type CreatorTabParams = {
  HomeTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
};

export type TeamTabParams = {
  TeamTab: undefined;
  CalendarTab: undefined;
  ProfileTab: undefined;
};

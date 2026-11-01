export type LinkPermission = "view" | "edit";
export type LinkTargetType = "card" | "brain";

export interface ShareLink {
  id: string;
  targetType: LinkTargetType;
  cardId: string | null;
  permission: LinkPermission;
  clicks: number;
  expiresAt: string;
  token: string;
}

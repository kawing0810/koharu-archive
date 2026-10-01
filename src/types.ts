export type Media = {
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  width?: number;
  height?: number;
};

export type TopFan = {
  name: string;
  avatar: string;
  count: number;
};

export type Post = {
  id: string;
  createdAt: string;
  releasedAt?: string;
  limited: boolean;
  text: string;
  media: Media[];
  mediaCount?: number;
  likes?: number;
  comments?: number;
  topFans?: TopFan[];
};

export type Product = {
  id: string;
  name: string;
  tag: "轉蛋" | "拼圖";
  image: string;
};

export type Club = {
  name: string;
  idolName: string;
  account: string;
  followers: number;
  description: string;
  banner: string;
  avatar: string;
  instagram: string;
  instagramFollowers: string;
};

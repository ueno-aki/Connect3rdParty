type Follower = {
  xuid: string;
  isFavorite: boolean;
  isFollowingCaller: boolean;
  isFollowedByCaller: boolean;
  isIdentityShared: boolean;
  displayName: string;
  realName: string;
  displayPicRaw: string;
  showUserAsAvatar: string;
  gamertag: string;
  gamerScore: string;
  modernGamertag: string;
  modernGamertagSuffix: string;
  uniqueModernGamertag: string;
  xboxOneRep: string;
  presenceState: "Offline" | "Online";
  presenceText: string;
  isBroadcasting: boolean;
  isQuarantined: boolean;
  isXbox360Gamerpic: boolean;
  follower: {
    text: string;
    followedDateTime: string;
  };
  colorTheme: string;
  preferredFlag: string;
};

export interface Followers {
  people: Follower[];
}

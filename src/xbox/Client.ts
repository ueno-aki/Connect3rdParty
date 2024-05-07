import { Achievements } from "./Achievements";
import { Followers } from "./Friend";
import { LiveTokenGen } from "./LiveTokenGen";
import { SessionDirectory } from "./SessionDirectory";

export class XboxClient {
  get xuid(): string {
    if (!this.token_gen.token) throw new Error("'token_gen.token' is undefind.");
    return this.token_gen.token?.userXUID;
  }
  get userHash(): string {
    if (!this.token_gen.token) throw new Error("'token_gen.token' is undefind.");
    return this.token_gen.token?.userHash;
  }
  get XSTSToken(): string {
    if (!this.token_gen.token) throw new Error("'token_gen.token' is undefind.");
    return this.token_gen.token?.XSTSToken;
  }
  get authorizationHeader(): string {
    return `XBL3.0 x=${this.userHash};${this.XSTSToken}`;
  }
  readonly achievements: Achievements;
  readonly session_directory: SessionDirectory;
  constructor(public token_gen: LiveTokenGen) {
    this.achievements = new Achievements(this);
    this.session_directory = new SessionDirectory(this);
  }
  add_friend(xuid: string) {
    return fetch(`https://social.xboxlive.com/users/me/people/xuid(${xuid})`, {
      method: "PUT",
      headers: {
        Authorization: this.authorizationHeader,
      },
    });
  }
}

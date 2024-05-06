import { XboxClient } from "./Client";
import { Achievement } from "./RestTypes";

export class Achievements {
  static readonly uri: string = "https://achievements.xboxlive.com";
  xbox_authorization_header: string;
  xuid: string;
  constructor(client: XboxClient) {
    this.xuid = client.xuid;
    this.xbox_authorization_header = client.authorizationHeader;
  }
  async getAchievements(): Promise<Achievement[]> {
    const res = await fetch(`${Achievements.uri}/users/xuid(${this.xuid})/achievements`, {
      method: "GET",
      headers: {
        Authorization: this.xbox_authorization_header,
        "x-xbl-contract-version": "5",
      },
    });
    let data = await res.json();
    return data.achievements;
  }
}

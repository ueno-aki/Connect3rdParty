import { XboxClient } from "./Client";
import { Achievement } from "./RestTypes";

export class Achievements {
  static readonly uri: string = "https://achievements.xboxlive.com";
  constructor(public xbox_client: XboxClient) {}
  async getAchievements(): Promise<Achievement[]> {
    const res = await fetch(`${Achievements.uri}/users/xuid(${this.xbox_client.xuid})/achievements`, {
      method: "GET",
      headers: {
        Authorization: this.xbox_client.authorizationHeader,
        "x-xbl-contract-version": "5",
      },
    });
    const data = await res.json();
    return data.achievements;
  }
}

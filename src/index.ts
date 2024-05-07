import { ping } from "bedrock-protocol";
import { EventEmitter } from "events";
import { LiveTokenGen } from "./xbox/LiveTokenGen";
import { XboxClient } from "./xbox/Client";
import { RealTimeActivity } from "./xbox/rta";
import { IMessageEvent } from "websocket";
import { Followers } from "./xbox/Friend";

const ConfigConstants = {
  SERVICE_CONFIG_ID: "4fc10100-5f7a-4470-899b-280835760c07", // The service config ID for Minecraft
  CLIENT_ID: "00000000441cc96b", // Nintendo Switch Title ID
} as const;

export interface ServerMotd {
  motd: string;
  name: string;
  protocol: number;
  version: string;
  playersOnline: number;
  playersMax: number;
  serverId: string;
  levelName: string;
  gamemodeId: number;
  gamemode: string;
  portV4: number;
  portV6: number;
}

export interface ConnectionOption {
  ip: string;
  port: number;
  ms_account: string;
  cache_path: string;
  auto_friending: boolean;
  logging: "default" | "debug";
}

export interface CustomMotdProperties {
  BroadcastSetting: number;
  CrossPlayDisabled: boolean;
  Joinability: "joinable_by_friends";
  LanGame: boolean;
  MaxMemberCount: number;
  MemberCount: number;
  OnlineCrossPlatformGame: boolean;
  SupportedConnections: {
    ConnectionType: 6;
    HostIpAddress: string;
    HostPort: number;
    RakNetGUID: string;
  }[];
  TitleId: number;
  TransportLayer: number;
  levelId: string;
  hostName: string;
  ownerId: string;
  rakNetGUID: string;
  worldName: string;
  worldType: string;
  protocol: number;
  version: string;
}

async function getAdvertisement(ip: string, port: number): Promise<ServerMotd | undefined> {
  let result: ServerMotd | undefined;
  try {
    result = (await ping({ host: ip, port })) as ServerMotd;
  } catch (error) {}
  return result;
}

export class ThirdPartyConnection extends EventEmitter {
  port: number;
  ip: string;
  auto_friending: boolean;

  xbox_client?: XboxClient;

  // custom motd properties
  hostName: string;
  worldName: string;
  worldType: string;
  protocol: number;
  version: string;
  MemberCount: number;
  MaxMemberCount: number;

  custom_motd?: CustomMotdProperties;

  rta?: RealTimeActivity;

  static async create(option: ConnectionOption): Promise<ThirdPartyConnection> {
    if (option.logging == "default") console.debug = () => {};
    const motd = await getAdvertisement(option.ip, option.port);
    if (!motd) throw new Error("RakTimeout [Error]: Ping timed out");
    return new ThirdPartyConnection(option, motd);
  }

  private constructor(option: ConnectionOption, advertisement: ServerMotd) {
    super();
    const { motd, levelName, gamemode, protocol, version, playersOnline, playersMax } = advertisement;
    this.hostName = motd;
    this.worldName = levelName;
    this.worldType = gamemode;
    this.protocol = protocol;
    this.version = version;
    this.MemberCount = playersOnline;
    this.MaxMemberCount = playersMax;

    const { ip, port, ms_account, cache_path, auto_friending } = option;
    this.ip = ip;
    this.port = port;
    this.auto_friending = auto_friending;
    const token_gen = new LiveTokenGen(ms_account, cache_path, { flow: "live", authTitle: LiveTokenGen.CLIENT_ID, deviceType: "Nintendo" });
    token_gen.start_process();
    token_gen.on("FirstTokenGenerated", () => {
      this.xbox_client = new XboxClient(token_gen);
      this.custom_motd = this.createCustomMotdProperties();
      this.checkAchievement();
    });
    this.on("PassedAchievementChecked", () => {
      if (!this.xbox_client || !this.custom_motd) throw new Error("'this.xbox_client or this.custom_motd' is undefined.");
      this.rta = new RealTimeActivity(
        this.xbox_client,
        {
          properties: {
            system: {
              joinRestriction: "followed",
              readRestriction: "followed",
              closed: false,
            },
            custom: this.custom_motd,
          },
        },
        ConfigConstants.SERVICE_CONFIG_ID,
        "MinecraftLobby",
        ({ session_request }) => {
          if (!this.custom_motd) throw new Error("'this.custom_motd' is undefined.");
          session_request.properties.custom = this.custom_motd;
        }
      );
      this.rta.start();
      this.rta.on("open", () => {
        console.log("[RTA:open] Connected to RTA Websocket");
      });
      this.rta.on("SessionResponse", (res: Response) => {
        console.debug("[RTA:SessionResponse] update session.");
      });
      this.rta.on("message", (event: IMessageEvent) => {
        console.debug("[RTA:message]", event);
      });
      this.rta.on("activity", (res) => {
        console.debug("[RTA:activity]", res);
      });

      setInterval(async () => {
        if (this.auto_friending) this.auto_friend();
        const ad = await getAdvertisement(this.ip, this.port);
        if (!ad) return;
        const { motd, levelName, gamemode, protocol, version, playersOnline, playersMax } = ad;
        this.hostName = motd;
        this.worldName = levelName;
        this.worldType = gamemode;
        this.protocol = protocol;
        this.version = version;
        this.MemberCount = playersOnline;
        this.MaxMemberCount = playersMax;
        this.custom_motd = this.createCustomMotdProperties();
      }, 15000);
    });
  }
  async checkAchievement() {
    const { xbox_client } = this;
    if (!xbox_client) throw new Error("'this.xbox_client' is undefined.");
    console.log(`[Achievement:xuid(${xbox_client.xuid})] Checking for Achievements`);
    const achievements = await xbox_client.achievements.getAchievements();
    if (achievements.length == 0) {
      console.log(`[Achievement:xuid(${xbox_client.xuid})] Passed Achievement Check`);
      this.emit("PassedAchievementChecked");
    } else {
      throw new Error(`This account "${xbox_client.xuid}" has achievements, please use an alt account without achievements to protect your account.`);
    }
  }
  createCustomMotdProperties(): CustomMotdProperties {
    if (!this.xbox_client) throw new Error("'this.xbox_client' is undefined.");
    return {
      BroadcastSetting: 2,
      CrossPlayDisabled: false,
      Joinability: "joinable_by_friends",
      LanGame: true,
      MaxMemberCount: this.MaxMemberCount,
      MemberCount: this.MemberCount,
      OnlineCrossPlatformGame: true,
      SupportedConnections: [
        {
          ConnectionType: 6,
          HostIpAddress: this.ip,
          HostPort: this.port,
          RakNetGUID: "",
        },
      ],
      TitleId: 0,
      hostName: this.hostName,
      ownerId: this.xbox_client.xuid,
      rakNetGUID: "",
      worldName: this.worldName,
      worldType: this.worldType,
      protocol: this.protocol,
      version: this.version,
      levelId: "level",
      TransportLayer: 0,
    };
  }

  async auto_friend() {
    if (!this.xbox_client) throw new Error("this.xbox_client is undefined.");
    let responce = await fetch(`https://peoplehub.xboxlive.com/users/xuid(${this.xbox_client.xuid})/people/followers`, {
      method: "GET",
      headers: {
        Authorization: `XBL3.0 x=${this.xbox_client.userHash};${this.xbox_client.XSTSToken}`,
        "x-xbl-contract-version": "5",
      },
    });
    let followers = (await responce.json()) as Followers;
    for (let follower of followers.people) {
      if (!follower.isFollowingCaller) continue;
      if (!follower.isFollowedByCaller) {
        await this.xbox_client.add_friend(follower.xuid);
        console.log(`[AutoFriend] Add ${follower.displayName} to Friends`);
      }
    }
  }
}

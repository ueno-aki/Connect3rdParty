import { createHash } from "crypto";
import { EventEmitter } from "events";
import * as fs from "fs";
import { Authflow, Titles } from "prismarine-auth";

function create_email_hash(email: string): string {
  return createHash("sha1").update(email, "binary").digest("hex").substring(0, 6);
}

export interface XboxToken {
  userXUID: string;
  userHash: string;
  XSTSToken: string;
  expiresOn: number;
}

export interface LiveCache {
  token: {
    token_type: string;
    expires_in: number;
    scope: string;
    access_token: string;
    refresh_token: string;
    user_id: string;
    obtainedOn: number;
  };
}

export interface AuthFlowOptions {
  authTitle?: Titles;
  deviceType?: string;
  deviceVersion?: string;
  password?: string;
  flow: "live";
}

export class LiveTokenGen extends EventEmitter {
  static CLIENT_ID = Titles.MinecraftNintendoSwitch;
  email_hash: string;
  live_cache?: LiveCache;
  token?: XboxToken;
  constructor(public email: string, public cache_path: string, public auth_option: AuthFlowOptions) {
    super();
    this.email_hash = create_email_hash(email);
  }
  async start_process() {
    this.token = await this.auth();
    this.emit("FirstTokenGenerated");
    this.continue_process();
  }
  continue_process() {
    if (!this.live_cache) throw new Error("liveCache is undefined");
    let expiry = this.live_cache.token.expires_in * 1000;
    expiry += this.live_cache.token.obtainedOn;
    setInterval(() => {
      // 23hours later
      if (expiry - Date.now() - 60 * 60 * 1000 < 0) this.access_new_token();
    }, 15 * 60 * 1000);
  }
  reset_cache() {
    fs.unlinkSync(`${this.cache_path}/${this.email_hash}_xbl-cache.json`);
    fs.unlinkSync(`${this.cache_path}/${this.email_hash}_live-cache.json`);
  }
  async access_new_token() {
    this.reset_cache();
    this.token = await this.auth();
  }
  async auth(): Promise<XboxToken> {
    const token = await new Authflow(this.email, this.cache_path, this.auth_option).getXboxToken();
    this.live_cache = JSON.parse(fs.readFileSync(`${this.cache_path}/${this.email_hash}_live-cache.json`, "utf-8"));
    return token;
  }
}

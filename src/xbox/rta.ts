import { XboxClient } from "./Client";
import { SessionRequest } from "./SessionDirectory";
import EventEmitter from "events";
import { randomUUID } from "crypto";
import { w3cwebsocket, ICloseEvent, IMessageEvent } from "websocket";

export class RealTimeActivity extends EventEmitter {
  static URI: string = "wss://rta.xboxlive.com";
  websocketConnected: boolean = false;
  connectionId: string = "";
  session_name: string;
  constructor(
    public xbox_client: XboxClient,
    public session_request: SessionRequest,
    public service_config_id: string,
    public session_template_name: string,
    public updateSessionCallback: (rtaMultiplayerSession: RealTimeActivity) => void
  ) {
    super();
    this.session_name = randomUUID();
  }
  start() {
    const ws = new w3cwebsocket(`${RealTimeActivity.URI}/connect`, "echo-protocol", undefined, {
      Authorization: this.xbox_client.authorizationHeader,
    });
    ws.onopen = () => {
      ws.send('[1,1,"https://sessiondirectory.xboxlive.com/connections/"]');
      this.websocketConnected = true;
      this.emit("open");
      console.log("open");
    };
    ws.onerror = (error: Error) => {
      this.websocketConnected = false;
      this.emit("error", error);
      console.log("error");
    };
    ws.onclose = (event: ICloseEvent) => {
      this.websocketConnected = false;
      this.start();
      this.emit("close", event);
      console.log("close");
    };
    ws.onmessage = (event: IMessageEvent) => {
      switch (typeof event.data) {
        case "string":
          if (event.data.includes("ConnectionId")) {
            this.connectionId = JSON.parse(event.data)[4].ConnectionId;
            this.updateSession();
          }
        default:
          this.emit("message", event.data);
      }
    };
  }

  updateSession() {
    this.updateSessionCallback(this);

    this.session_request.members = {
      me: {
        constants: {
          system: {
            initialize: true,
            xuid: this.xbox_client.xuid,
          },
        },
        properties: {
          system: {
            active: true,
            connection: this.connectionId,
            subscription: {
              changeTypes: ["everything"],
              id: "9042513B-D0CF-48F6-AF40-AD83B3C9EED4",
            },
          },
        },
      },
    };

    this.xbox_client.session_directory
      .session(this.session_request, this.service_config_id, this.session_template_name, this.session_name)
      .then(async (res) => {
        let data = await res.json();
        this.emit("SessionResponse", data);
        if (this.websocketConnected) {
          this.xbox_client.session_directory
            .setActivity({
              scid: this.service_config_id,
              templateName: this.session_template_name,
              name: this.session_name,
            })
            .then(async (res) => {
              this.emit("join", await res.text());
            });
        }
      });
  }
}

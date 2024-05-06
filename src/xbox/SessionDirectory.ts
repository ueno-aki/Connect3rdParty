import { CustomMotdProperties } from "../index";
import { XboxClient } from "./Client";
import { MultiplayerSessionReference } from "./RestTypes";
export interface SessionRequest {
  properties: {
    system: {
      joinRestriction: string;
      readRestriction: string;
      closed: boolean;
    };
    custom: CustomMotdProperties;
  };
  members?: {
    me: {
      constants: { system: { xuid: string; initialize: boolean } };
      properties: { system: { active: boolean; connection: string; subscription: { id: string; changeTypes: string[] } } };
    };
  };
}

export interface SessionConnection {
  ConnectionType: number;
  HostIpAddress: string;
  HostPort: number;
  RakNetGUID: string;
}

export class SessionDirectory {
  static readonly URI: string = "https://sessiondirectory.xboxlive.com";
  authorizationHeader: string;
  constructor(xboxLiveClient: XboxClient) {
    this.authorizationHeader = xboxLiveClient.authorizationHeader;
  }

  setActivity(sessionReference: MultiplayerSessionReference) {
    return fetch(`${SessionDirectory.URI}/handles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authorizationHeader,
        "x-xbl-contract-version": "107",
      },
      body: JSON.stringify({
        version: 1,
        type: "activity",
        sessionRef: sessionReference,
      }),
    });
  }

  session(multiplayerSessionRequest: SessionRequest, serviceConfigId: string, sessionTemplateName: string, sessionName: string) {
    return fetch(`${SessionDirectory.URI}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authorizationHeader,
        "x-xbl-contract-version": "107",
      },
      body: JSON.stringify(multiplayerSessionRequest),
    });
  }

  sessionKeepAlivePacket(serviceConfigId: string, sessionTemplateName: string, sessionName: string) {
    return fetch(`${SessionDirectory.URI}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authorizationHeader,
        "x-xbl-contract-version": "107",
      },
    });
  }

  removeMember(serviceConfigId: string, sessionTemplateName: string, sessionName: string, index: number) {
    return fetch(
      `${SessionDirectory.URI}/serviceconfigs/${serviceConfigId}/sessionTemplates/${sessionTemplateName}/sessions/${sessionName}/members/${index}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authorizationHeader,
          "x-xbl-contract-version": "107",
        },
      }
    );
  }
}

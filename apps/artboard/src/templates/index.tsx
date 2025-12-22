import type { Template } from "@reactive-resume/utils";

import { Apex } from "./apex";
import { Sovereign } from "./sovereign";
import { Imperial } from "./imperial";
import { Vanguard } from "./vanguard";
import { Vertex } from "./vertex";
import { Meridian } from "./meridian";
import { Ascend } from "./ascend";
import { Clarity } from "./clarity";
import { Legacy } from "./legacy";
import { Prestige } from "./prestige";
import { Noble } from "./noble";
import { Regal } from "./regal";

export const getTemplate = (template: Template) => {
  switch (template) {
    case "apex": {
      return Apex;
    }
    case "sovereign": {
      return Sovereign;
    }
    case "imperial": {
      return Imperial;
    }
    case "vanguard": {
      return Vanguard;
    }
    case "vertex": {
      return Vertex;
    }
    case "meridian": {
      return Meridian;
    }
    case "ascend": {
      return Ascend;
    }
    case "clarity": {
      return Clarity;
    }
    case "legacy": {
      return Legacy;
    }
    case "prestige": {
      return Prestige;
    }
    case "noble": {
      return Noble;
    }
    case "regal": {
      return Regal;
    }
    default: {
      return Prestige;
    }
  }
};

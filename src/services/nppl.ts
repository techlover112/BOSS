import express from "express";
import xmlbuilder from "xmlbuilder";
import moment from "moment";
import { PolicyList } from "../models/policy-list";

const nppl = express.Router();

nppl.get("/p01/policylist/:consoleType/:countryCode/:majorVersion", async (request, response) => {
  const { consoleType, countryCode, majorVersion } = request.params;

  if (consoleType !== "0" && consoleType !== "1") {
    response.sendStatus(500);
    return;
  }

  const defaultPolicyList = {
    country_code: countryCode,
    major_version: Number(majorVersion),
    list_id: 1891, // Default list version ID
    default_stop: false,
    force_version_up: false,
    priority: [
      {
        title_id: "0004003000008f02",
        task_id: "basho0",
        level: "HIGH",
        persistent: true,
        revive: true
      }
    ],
    updated: Date.now()
  };

  try {
    // Atomically find or create the document with fallback defaults
    const policyDoc = await PolicyList.findOneAndUpdate(
      {
        country_code: countryCode,
        major_version: Number(majorVersion)
      },
      {
        $setOnInsert: defaultPolicyList
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const policylist = {
      PolicyList: {
        MajorVersion: policyDoc.major_version,
        MinorVersion: 0,
        ListId: policyDoc.list_id,
        DefaultStop: policyDoc.default_stop,
        ForceVersionUp: policyDoc.force_version_up,
        UpdateTime: moment(Number(policyDoc.updated)).utc().format("YYYY-MM-DDTHH:mm:ss+0000"),
        Priority: policyDoc.priority.map((p: any) => ({
          TitleId: p.title_id,
          TaskId: p.task_id,
          Level: p.level,
          Persistent: p.persistent,
          Revive: p.revive
        }))
      }
    };

    response.set("Content-Type", "application/xml; charset=utf-8");
    response.send(xmlbuilder.create(policylist, { headless: true }).end({ pretty: true }));
  } catch (error) {
    console.error(error);
    response.sendStatus(500);
  }
});

export default nppl;

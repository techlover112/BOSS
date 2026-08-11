import mongoose from "mongoose";

const PolicyListSchema = new mongoose.Schema({
  country_code: { type: String, required: true, index: true },
  major_version: { type: Number, required: true },
  list_id: { type: Number, required: true },
  default_stop: { type: Boolean, default: false },
  force_version_up: { type: Boolean, default: false },
  priority: [{
    title_id: String,
    task_id: String,
    level: String,
    persistent: Boolean,
    revive: Boolean
  }],
  updated: BigInt
}, { id: false });

PolicyListSchema.index({ country_code: 1, major_version: 1 }, { unique: true });

export const PolicyList = mongoose.model("PolicyList", PolicyListSchema, "policy-lists");
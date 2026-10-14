import { contentData } from "@/data/index.ts";
import { buildViews } from "./scoring.ts";

/** 모든 내용은 data/*.json에서 빌드 시점에 읽는다 */
export const LEADERS = buildViews(contentData());

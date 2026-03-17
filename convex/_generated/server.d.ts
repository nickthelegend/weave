/* eslint-disable */
/**
 * Generated server definitions.
 */
import {
    ActionBuilder,
    HttpRouter,
    MutationBuilder,
    QueryBuilder,
} from "convex/server";
import type { DataModel } from "./dataModel.d.ts";

export declare const query: QueryBuilder<DataModel, "public">;
export declare const mutation: MutationBuilder<DataModel, "public">;
export declare const action: ActionBuilder<DataModel, "public">;
export declare const httpTable: () => HttpRouter;

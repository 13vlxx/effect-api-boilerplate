import { AppLayer } from "#src/app.layer.ts";
import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";

Layer.launch(AppLayer).pipe(NodeRuntime.runMain);

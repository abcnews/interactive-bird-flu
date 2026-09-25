import tinycolor from "tinycolor2";
import * as v from "@valibot/valibot";
import { parse as parseCoreHash } from "@abcnews/core-hash-converter";
import Base62Str from "base62str";
const base62 = Base62Str.createInstance();

export const DEFAULTS = {
  annotation: {
    colour: "black",
    outlineColour: "white",
    top: 50,
    left: 50,
    anchor: "left",
    width: 10,
  },
  boundingBox: {
    colour: "aqua",
    strokeWidth: 2,
    borderRadius: 4,
    fillColour: "transparent",
  },
} as const;

// Valibot schemas
// ---------------

/** 0–100, as authored in the hash. */
const Percent = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

/** Any tinycolor-parseable colour, normalised to a hex string. */
const Colour = v.pipe(
  v.string(),
  v.check((s) => tinycolor(s).isValid(), "Not a recognised colour"),
  v.transform((s) => tinycolor(s).toRgbString()),
);

/** Base62 output can be all digits, so `coerce` may hand us a number. */
const Base62Text = v.pipe(
  v.union([v.string(), v.pipe(v.number(), v.transform(String))]),
  v.transform((s) => base62.decodeStr(s)),
);

const AnnotationSchema = v.object({
  text: Base62Text,
  colour: v.optional(Colour, DEFAULTS.annotation.colour),
  outlineColour: v.optional(Colour, DEFAULTS.annotation.outlineColour),
  top: v.optional(Percent, DEFAULTS.annotation.top),
  left: v.optional(Percent, DEFAULTS.annotation.left),
  anchor: v.optional(v.picklist(["left", "right"]), DEFAULTS.annotation.anchor),
  width: v.optional(v.number(), DEFAULTS.annotation.width),
  name: v.optional(v.string()),
});

export const AnnotationFromHash = v.pipe(
  v.string("Expected a mount value"),
  v.nonEmpty("Mount value is empty"),
  v.transform(parseCoreHash),
  AnnotationSchema,
);

const BoundingBoxSchema = v.object({
  topX: Percent,
  topY: Percent,
  bottomX: Percent,
  bottomY: Percent,
  colour: v.optional(Colour, DEFAULTS.boundingBox.colour),
  strokeWidth: v.optional(
    v.pipe(v.number(), v.minValue(0)),
    DEFAULTS.boundingBox.strokeWidth,
  ),
  borderRadius: v.optional(v.number(), DEFAULTS.boundingBox.borderRadius),
  fillColour: v.optional(Colour, DEFAULTS.boundingBox.fillColour),
  name: v.optional(v.string()),
});

export const BoundingBoxFromHash = v.pipe(
  v.string("Expected a mount value"),
  v.nonEmpty("Mount value is empty"),
  v.transform(parseCoreHash),
  BoundingBoxSchema,
);

export type Annotation = v.InferOutput<typeof AnnotationSchema>;
export type BoundingBox = v.InferOutput<typeof BoundingBoxSchema>;
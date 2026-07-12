import {Cube} from "./Cube.ts";
import {test, expect} from "vitest";

test("correct sticker count from dimension", () => {
    let cube = new Cube(3);
    expect(cube.stickers.length).eq(3*3*6);
    expect(cube.dimension).eq(3)

    cube = new Cube(4);
    expect(cube.stickers.length).eq(4*4*6)
    expect(cube.dimension).eq(4)
})

// TODO: add more tests
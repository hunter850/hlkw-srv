import { db } from "./src/drizzle/dbs/bd2Db";
// import { CharacterTable } from "./src/drizzle/schemas/bd2";
import { CostumeTable } from "./src/drizzle/schemas/bd2";

async function main() {
    // try {
    //     const result = await db
    //         .insert(CharacterTable)
    //         .values([
    //             {
    //                 idChar: "0001",
    //                 name: "拉德爾",
    //                 enName: "Lathel",
    //                 avatar: "https://i.imgur.com/lHH84mP.png",
    //             },
    //         ])
    //         .returning();
    //     console.log("insert character result: ", result);
    // } catch (error: any) {
    //     console.log("error: ", error);
    // }
    try {
        const result = await db
            .insert(CostumeTable)
            .values([
                {
                    idCostume: "000101",
                    costumeName: "草藥獵人",
                    characterId: 1,
                    costumeAvatar: "https://i.imgur.com/lHH84mP.png",
                },
            ])
            .returning();
        console.log("insert character result: ", result);
    } catch (error: any) {
        console.log("error: ", error);
    }
}

main();

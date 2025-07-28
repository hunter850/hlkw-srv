function calculateBD2EquipLevel(levelString: string): number {
    // 驗證輸入長度
    if (levelString.length !== 3) {
        throw new Error("輸入字串長度必須為3");
    }

    // 分數對照表
    const scoreMap: { [key: string]: number } = {
        S: 4,
        A: 3,
        B: 2,
        C: 1,
    };

    // 位置權重 (由左到右分別乘以 1, 2, 3)
    const weights = [1, 2, 3];

    let totalScore = 0;

    // 計算每個位置的分數
    for (let i = 0; i < 3; i++) {
        const char = levelString[i].toUpperCase();

        // 驗證字元是否有效
        if (!(char in scoreMap)) {
            throw new Error(`無效字元 '${char}'，只能使用 S、A、B、C`);
        }

        totalScore += scoreMap[char] * weights[i];
    }

    return totalScore;
}

export default calculateBD2EquipLevel;

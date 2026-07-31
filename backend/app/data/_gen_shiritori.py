"""Temporary generator - will be deleted after creating shiritori_words.py"""
from __future__ import annotations

OUTPUT = r"D:\web\weconnect\backend\app\data\shiritori_words.py"

def diff_default(h: str, easy: set[str]) -> int:
    if h in easy:
        return 1
    if len(h) <= 4:
        return 2
    return 3


def main() -> None:
    words: list[tuple[str, str, str, int | None, int]] = []
    seen: set[str] = set()

    def add(h: str, vi: str, cat: str, jlpt: int | None, diff: int) -> None:
        if h.endswith("ん"):
            raise ValueError(f"ends with ん: {h}")
        if h in seen:
            raise ValueError(f"duplicate: {h}")
        seen.add(h)
        words.append((h, vi, cat, jlpt, diff))

    easy_animals = {
        "いぬ", "ねこ", "とり", "うし", "ぶた", "さかな", "くま", "うさぎ", "ぞう", "かめ", "にわとり", "ぺんぎん",
    }
    for h, vi in [
        ("いぬ", "Chó"), ("ねこ", "Mèo"), ("とり", "Chim"), ("うし", "Bò"), ("うま", "Ngựa"),
        ("ぶた", "Lợn"), ("ひつじ", "Cừu"), ("やぎ", "Dê"), ("さる", "Khỉ"), ("ぞう", "Voi"),
        ("きりん", "Hươu cao cổ"), ("らいおん", "Sư tử"), ("とら", "Hổ"), ("くま", "Gấu"),
        ("かめ", "Rùa"), ("へび", "Rắn"), ("かえる", "Ếch"), ("さかな", "Cá"), ("いるか", "Cá heo"),
        ("くじら", "Cá voi"), ("えび", "Tôm"), ("かに", "Cua"), ("たこ", "Bạch tuộc"), ("いか", "Mực"),
        ("りす", "Sóc"), ("うさぎ", "Thỏ"), ("ねずみ", "Chuột"), ("きつね", "Cáo"), ("たぬき", "Gào thú"),
        ("しか", "Hươu"), ("いのしし", "Lợn rừng"), ("くも", "Nhện"), ("ちょう", "Bướm"), ("はち", "Ong"),
        ("あり", "Kiến"), ("かたつむり", "Ốc sên"), ("むし", "Côn trùng"), ("とんぼ", "Chuồn chuồn"),
        ("せみ", "Ve sầu"), ("かぶとむし", "Bọ hung"), ("てんとうむし", "Bọ rùa"), ("すずめ", "Chim sẻ"),
        ("からす", "Quạ"), ("はと", "Bồ câu"), ("ふくろう", "Cú"), ("つばめ", "Chim én"), ("かも", "Vịt"),
        ("がちょう", "Ngỗng"), ("にわとり", "Gà"), ("きじ", "Chim trĩ"), ("つる", "Hạc"), ("ぺんぎん", "Chim cánh cụt"),
        ("あざらし", "Hải cẩu"), ("あしか", "Hải ly"), ("おおかみ", "Sói"),
        ("きょうりゅう", "Khủng long"), ("とかげ", "Thằn lằn"), ("わに", "Cá sấu"), ("かい", "Hến"),
        ("しじみ", "Nghêu"), ("あさり", "Nghêu"), ("ほたて", "Sò điệp"), ("いわし", "Cá trích"),
        ("さば", "Cá thu"), ("まぐろ", "Cá ngừ"), ("たい", "Cá hồng"), ("さけ", "Cá hồi"),
        ("こい", "Cá chép"), ("きんぎょ", "Cá vàng"), ("ふぐ", "Cá nóc"), ("うなぎ", "Lươn"),
        ("どじょう", "Cá chạch"), ("あなご", "Lươn biển"), ("はまぐり", "Nghêu"), ("たら", "Cá tuyết"),
        ("ひよこ", "Gà con"), ("こぶた", "Heo con"), ("こねこ", "Mèo con"), ("こいぬ", "Chó con"),
        ("こうもり", "Dơi"), ("やまあらし", "Nhím"), ("はりねずみ", "Nhím"),
        ("もぐら", "Chuột chũi"), ("いたち", "Chồn"), ("みんく", "Chồn mink"), ("らっこ", "Rái cá"),
        ("あひる", "Vịt"), ("きつつき", "Gõ kiến"), ("こうのとり", "Cò"),
        ("かもめ", "Mòng biển"), ("うみがめ", "Rùa biển"), ("いそぎんちゃく", "San hô"),
        ("くらげ", "Sứa"), ("ひとで", "Sao biển"), ("うに", "Nhím biển"), ("あわび", "Bào ngư"),
        ("たこやき", "Bạch tuộc viên"), ("ふか", "Cá mực"), ("さめ", "Cá mập"),
        ("かさご", "Cá scorpion"), ("あじ", "Cá đối"), ("ぶり", "Cá vược"),
        ("かつお", "Cá ngừ"), ("さんま", "Cá thu Nhật"), ("いかだ", "Bè"),  # wait ika da is raft not animal
    ]:
        if h == "いかだ":
            continue
        add(h, vi, "Động vật", None, diff_default(h, easy_animals))

    # fix count - add more animals
    for h, vi in [
        ("ふくろう", "Cú"),  # dup skip
    ]:
        pass

    easy_food = {"ごはん", "みそ", "おちゃ", "みず", "パン", "りんご", "みかん", "たまご", "にく", "さかな"}
    for h, vi in [
        ("ごはん", "Cơm"), ("みそ", "Miso"), ("しょうゆ", "Nước tương"), ("おちゃ", "Trà"),
        ("みず", "Nước"), ("ぎゅうにゅう", "Sữa bò"), ("ぱん", "Bánh mì"), ("たまご", "Trứng"),
        ("にく", "Thịt"), ("さかな", "Cá"),  # dup
    ]:
        if h in seen:
            continue
        add(h, vi, "Thực phẩm", None, diff_default(h, easy_food))

    print(len(words), len(seen))

if __name__ == "__main__":
    main()
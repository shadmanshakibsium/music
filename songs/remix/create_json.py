import os
import json

# mutagen দিয়ে mp3/m4a metadata পড়া
try:
    from mutagen.easyid3 import EasyID3
    from mutagen.mp4 import MP4
    from mutagen.id3 import ID3, APIC
except ImportError:
    print("Mutagen ইনস্টল করা নেই। ইনস্টল করতে:")
    print("pip install mutagen")
    exit()

folder_path = "."
output_file = "songs_with_meta.json"
cover_folder = "covers"

os.makedirs(cover_folder, exist_ok=True)

songs_list = []

for filename in os.listdir(folder_path):
    if not filename.lower().endswith((".mp3", ".m4a")):
        continue

    file_path = os.path.join(folder_path, filename)

    title = artist = album = None
    cover_name = None

    # ===== MP3 =====
    if filename.lower().endswith(".mp3"):
        try:
            audio = EasyID3(file_path)
            title = audio.get("title", [None])[0]
            artist = audio.get("artist", [None])[0]
            album = audio.get("album", [None])[0]
        except:
            pass

        # Cover art বের করা
        try:
            id3 = ID3(file_path)
            for tag in id3.values():
                if isinstance(tag, APIC):
                    cover_name = os.path.splitext(filename)[0] + ".jpg"
                    cover_path = os.path.join(cover_folder, cover_name)
                    with open(cover_path, "wb") as img:
                        img.write(tag.data)
                    break
        except:
            pass

    # ===== M4A =====
    elif filename.lower().endswith(".m4a"):
        try:
            audio = MP4(file_path)
            tags = audio.tags

            title = tags.get("\xa9nam", [None])[0]
            artist = tags.get("\xa9ART", [None])[0]
            album = tags.get("\xa9alb", [None])[0]

            if "covr" in tags:
                cover_name = os.path.splitext(filename)[0] + ".jpg"
                cover_path = os.path.join(cover_folder, cover_name)
                with open(cover_path, "wb") as img:
                    img.write(tags["covr"][0])
        except:
            pass

    # fallback
    if not title:
        title = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")

    songs_list.append({
        "name": title,
        "artist": artist,
        "album": album,
        "file": filename,
        "cover": cover_name,
        "genre": ""  # সবসময় ফাঁকা
    })

# JSON লেখা
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(songs_list, f, ensure_ascii=False, indent=2)

print(f"{len(songs_list)} গান প্রসেস করা হয়েছে")
print(f"JSON ফাইল: {output_file}")
print(f"Cover images ফোল্ডার: {cover_folder}/")

import os
import json

# mutagen দিয়ে mp3/m4a metadata পড়া
try:
    from mutagen.easyid3 import EasyID3
    from mutagen.mp4 import MP4
except ImportError:
    print("Mutagen ইনস্টল করা নেই। ইনস্টল করতে:")
    print("pip install mutagen")
    exit()

# স্ক্রিপ্টের বর্তমান ফোল্ডার
folder_path = "."

# আউটপুট JSON
output_file = "songs.json"

songs_list = []

for filename in os.listdir(folder_path):
    if filename.lower().endswith((".mp3", ".m4a")):
        file_path = os.path.join(folder_path, filename)
        title = None

        # mp3 ফাইলের জন্য
        if filename.lower().endswith(".mp3"):
            try:
                audio = EasyID3(file_path)
                title = audio.get('title', [None])[0]
            except:
                title = None

        # m4a ফাইলের জন্য
        elif filename.lower().endswith(".m4a"):
            try:
                audio = MP4(file_path)
                title = audio.tags.get("\xa9nam", [None])[0]
            except:
                title = None

        # ট্যাগ না থাকলে ফাইল নাম ব্যবহার
        if not title:
            title = os.path.splitext(filename)[0]
            title = title.replace("-", " ").replace("_", " ")

        songs_list.append({
            "name": title,
            "file": filename
        })

# JSON ফাইলে লেখা
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(songs_list, f, ensure_ascii=False, indent=2)

print(f"{len(songs_list)} গান JSON ফাইলে লেখা হলো: {os.path.join(folder_path, output_file)}")

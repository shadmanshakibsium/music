import os
import shutil

def is_music_file(filename):
    music_extensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg']
    return any(filename.lower().endswith(ext) for ext in music_extensions)

def move_songs_in_batches(folder_path, batch_size=5):
    # ফোল্ডারের সব ফাইল লিস্ট করো
    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f)) and is_music_file(f)]
    
    # গ্রুপিং শুরু
    for i in range(0, len(files), batch_size):
        batch_files = files[i:i+batch_size]
        folder_number = i // batch_size + 1
        new_folder_path = os.path.join(folder_path, str(folder_number))
        
        if not os.path.exists(new_folder_path):
            os.mkdir(new_folder_path)
            print(f"Created folder: {new_folder_path}")
        
        # ফাইলগুলো মুভ করো
        for file in batch_files:
            src = os.path.join(folder_path, file)
            dst = os.path.join(new_folder_path, file)
            shutil.move(src, dst)
            print(f"Moved {file} to {new_folder_path}")

if __name__ == "__main__":
    current_folder = os.getcwd()
    move_songs_in_batches(current_folder)

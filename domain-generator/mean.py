import nltk
from nltk.corpus import words
import re
from tqdm import tqdm

# 下载 NLTK 英文字典（如尚未安装）
nltk.download('words')

# 定义常用缩写集合
COMMON_ABBREVIATIONS = {
    "ai", "ml", "iot", "usa", "uk", "api", "sdk", "ui", "ux", "db", "os", "cpu",
    "gpu", "nft", "iot", "vr", "ar", "url", "ip", "http", "https", "dns", "json"
}

# 加载 NLTK 英文字典
ENGLISH_WORDS = set(words.words())

# 功能函数：检查是否为有意义的单词或缩写
def is_valid_entry(entry):
    entry_lower = entry.lower()
    # 检查是否是英文单词或缩写
    return entry_lower in ENGLISH_WORDS or entry_lower in COMMON_ABBREVIATIONS

# 处理输入文件
def process_file(input_file, output_file):
    meaningful_entries = []

    # 读取输入文件
    with open(input_file, "r", encoding="utf-8") as file:
        lines = file.readlines()

    # 逐行处理，显示进度
    for line in tqdm(lines, desc="Processing Lines", unit="line"):
        # 提取每行最前面的字母组合（字母+数字）
        match = re.match(r"^[a-zA-Z0-9]+", line.strip())
        if match:
            entry = match.group()
            if is_valid_entry(entry):
                meaningful_entries.append(entry)

    # 将筛选结果保存到输出文件
    with open(output_file, "w", encoding="utf-8") as output:
        for entry in meaningful_entries:
            output.write(entry + "\n")

    print(f"\n筛选完成！结果已保存到 {output_file}")

# 指定输入和输出文件路径
# input_file_path = "available-domains-2024-11-24T05_37_54.636Z.txt"  # 替换为实际文件路径
input_file_path = "available-domains-2024-11-24T09_10_57.980Z.txt" 
output_file_path = "filtered_meaningful_entries.txt"

# 调用处理函数
process_file(input_file_path, output_file_path)

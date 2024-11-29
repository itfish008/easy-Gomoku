import nltk
from collections import Counter

# 下载 NLTK 的必要数据
nltk.download('words')
nltk.download('brown')

# 加载 NLTK 英文字典
word_list = set(nltk.corpus.words.words())

# 使用 Brown 语料库统计词频
brown_corpus_words = nltk.corpus.brown.words()
word_freq = Counter(word.lower() for word in brown_corpus_words)

# 筛选单词并统计频率
filtered_words = {}
for word in word_list:
    if 2 <= len(word) <= 6:  # 筛选 2 到 6 字母单词
        filtered_words[word] = word_freq.get(word.lower(), 0)

# 按词频排序
sorted_filtered_words = sorted(filtered_words.items(), key=lambda x: x[1], reverse=True)

# 保存所有符合条件的单词到文件
output_path_all = "filtered_words_with_frequency.txt"
with open(output_path_all, "w", encoding="utf-8") as file:
    for word, freq in sorted_filtered_words:
        file.write(f"{word}, {freq}\n")

# 筛选两个字母的单词
two_letter_words = {word: freq for word, freq in filtered_words.items() if len(word) == 2}
sorted_two_letter_words = sorted(two_letter_words.items(), key=lambda x: x[1], reverse=True)

# 保存两个字母的单词到单独文件
output_path_two_letter = "two_letter_words_with_frequency.txt"
with open(output_path_two_letter, "w", encoding="utf-8") as file:
    for word, freq in sorted_two_letter_words:
        file.write(f"{word}, {freq}\n")

print(f"所有符合条件的单词已保存到: {output_path_all}")
print(f"两个字母的单词已保存到: {output_path_two_letter}")

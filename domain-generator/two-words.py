from itertools import permutations

# 读取文件并提取两个字母单词
input_file = "two_letter_words_with_frequency.txt"  # 替换为实际文件路径
output_file = "two_letter_word_combinations.txt"  # 输出结果保存的路径

# 加载两个字母单词
with open(input_file, "r", encoding="utf-8") as file:
    two_letter_words = [line.split(",")[0].strip() for line in file if line.strip()]

# 生成排列组合
combinations = list(permutations(two_letter_words, 2))

# 保存排列组合到文件
with open(output_file, "w", encoding="utf-8") as output:
    for combo in combinations:
        output.write(f"{combo[0]} {combo[1]}\n")

print(f"排列组合已生成并保存到 {output_file}")

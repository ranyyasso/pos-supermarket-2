# POS copy review

Applied the installed `no-ai-slop` skill, matching [petergyang/no-ai-slop on skills.sh](https://www.skills.sh/petergyang/no-ai-slop/no-ai-slop), to receipt actions and printer setup instructions. This skill reviews writing, not the visual design or authorship of text.

## Edited copy

Receipt action: «معاينة وطباعة الإيصال»

Email/SMS action: «محاكاة إرسال الإيصال»

Print preview status: «معاينة فقط. لم يُرسل الإيصال إلى الطابعة.»

After requesting printing: «طُلب فتح نافذة الطباعة. إذا لم تظهر، افتح التطبيق في Chrome أو Edge. المتصفح لا يؤكد خروج الورق.»

Settings guidance: «ثبّت تعريف الطابعة في Windows أولاً. اختر ورق 80 مم، مقياس 100% وهوامش «بلا». عدد النسخ والقص التلقائي من إعدادات تعريف الطابعة، إن كان يدعمه.» The paper width changes with the selected setting.

## What changed

Replaced the vague «تأكيد الإيصال» action with the action the button performs. Kept «محاكاة» explicit for email/SMS. Removed the old simulated-print success message after implementing browser printing. Added exact paper width, scale and driver settings. Did not rewrite short, clear catalog or basket labels.

Replaced the generic heading helper «كل ما تحتاجه، بلمسة واحدة» with «اختر صنفاً لإضافته إلى السلة». The old sentence failed the skill's portability test: it could advertise an unrelated product unchanged.

Checked against the skill's eval.md: meaning preserved; minimal edits; concrete actions; no invented printing-success claim, filler, puffery or decorative emphasis. No claim that these checks detect AI authorship.

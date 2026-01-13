-- =====================================================
-- Goal-Specific Quest Templates Migration
-- Migration: 20260112_goal_specific_quests.sql
-- Description: Add 200+ goal-specific quest templates
--              Each goal_template gets 5-7 dedicated quests
--              with Easy/Medium/Hard difficulty distribution
-- =====================================================

-- Add progress_contribution column to daily_quests if not exists
ALTER TABLE daily_quests
ADD COLUMN IF NOT EXISTS progress_contribution NUMERIC DEFAULT 1;

COMMENT ON COLUMN daily_quests.progress_contribution IS 'How much this quest contributes to goal progress when completed';

-- =====================================================
-- FOOD CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: lose_weight (Kilo Vermek)
-- ===================
INSERT INTO quest_templates (category_slug, slug, title, description, emoji, xp_reward, difficulty, time_of_day, estimated_minutes, is_recurring_default, recurrence_pattern, goal_template_id, progress_contribution, sort_order) VALUES
('food', 'lw_morning_water', 'Sabah 500ml su ile başla', 'Uyanır uyanmaz metabolizmayı hızlandırmak için 500ml su iç', '💧', 5, 'easy', 'morning', 2, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.02, 1),
('food', 'lw_calorie_tracking', 'Günlük kalori takibi yap', 'Tüm öğünleri ve atıştırmalıkları kaydet', '📊', 15, 'medium', 'evening', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.05, 2),
('food', 'lw_cardio_30min', '30 dakika kardiyo yap', 'Koşu, bisiklet veya yürüyüş ile kardiyo antrenmanı', '🏃', 25, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.08, 3),
('food', 'lw_avoid_processed', 'İşlenmiş gıdalardan kaçın', 'Bugün fast food ve paketli atıştırmalık yeme', '🚫', 20, 'hard', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.08, 4),
('food', 'lw_protein_meals', 'Her öğünde protein al', 'Kahvaltı, öğle ve akşam yemeğinde protein kaynağı ekle', '🥩', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.05, 5),
('food', 'lw_no_sugar_drinks', 'Şekerli içeceklerden uzak dur', 'Sadece su, sade çay veya kahve tüket', '🥤', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.05, 6),
('food', 'lw_calorie_deficit', 'Kalori açığını koru', '400-500 kalori deficit hedefini tut', '🎯', 30, 'hard', 'evening', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), 0.1, 7),

-- ===================
-- GOAL: gain_muscle (Kas Kazanmak)
-- ===================
('food', 'gm_protein_breakfast', 'Proteinli kahvaltı yap', '30g+ protein içeren kahvaltı ile güne başla', '🍳', 10, 'easy', 'morning', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.05, 1),
('food', 'gm_post_workout_protein', 'Antrenman sonrası protein al', 'Egzersiz sonrası 30 dakika içinde protein tüket', '🥛', 10, 'easy', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.05, 2),
('food', 'gm_strength_training', 'Ağırlık antrenmanı yap', '45+ dakika direnç/ağırlık antrenmanı', '🏋️', 30, 'hard', 'anytime', 60, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.15, 3),
('food', 'gm_daily_protein_goal', 'Günlük protein hedefini tamamla', 'Vücut ağırlığı x 1.6g protein al', '📈', 20, 'medium', 'evening', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.1, 4),
('food', 'gm_calorie_surplus', 'Kalori fazlası tut', 'Günlük 300-500 kalori fazlası hedefini koru', '🍽️', 20, 'medium', 'evening', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.08, 5),
('food', 'gm_sleep_recovery', '7-8 saat uyku al', 'Kas gelişimi için yeterli uyku ve recovery', '😴', 25, 'hard', 'evening', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.1, 6),
('food', 'gm_progressive_overload', 'Progressive overload uygula', 'Her antrenmanda ağırlık veya tekrar artır', '📊', 20, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), 0.08, 7),

-- ===================
-- GOAL: intermittent_fasting (Aralıklı Oruç)
-- ===================
('food', 'if_fasting_water', 'Oruç saatinde bol su iç', 'Açlık hissini azaltmak için su iç', '💧', 5, 'easy', 'morning', 1, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), 0.3, 1),
('food', 'if_black_coffee', 'Şekersiz kahve/çay ile başla', 'Orucu bozmayan sıfır kalorili içecek', '☕', 5, 'easy', 'morning', 2, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), 0.3, 2),
('food', 'if_16_hours', '16 saat oruç tamamla', 'Yemek penceresini 8 saatte tut', '⏰', 25, 'hard', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), 1, 3),
('food', 'if_protein_first', 'İlk öğünde protein ağırlıklı ye', 'Orucu protein ile aç', '🥗', 15, 'medium', 'afternoon', 20, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), 0.5, 4),
('food', 'if_no_late_eating', 'Akşam 20:00 sonrası yeme', 'Yemek penceresini erken kapat', '🌙', 15, 'medium', 'evening', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), 0.5, 5),

-- ===================
-- GOAL: drink_water (Su İçme Alışkanlığı)
-- ===================
('food', 'dw_morning_glass', 'Sabah 2 bardak su iç', 'Uyanır uyanmaz hidrasyon', '💧', 5, 'easy', 'morning', 2, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'drink_water'), 2, 1),
('food', 'dw_before_meals', 'Yemeklerden önce su iç', 'Her öğünden 15dk önce 1 bardak su', '🥤', 10, 'easy', 'anytime', 1, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'drink_water'), 3, 2),
('food', 'dw_hourly_reminder', 'Her saat su iç', 'Saat başı en az yarım bardak su', '⏰', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'drink_water'), 2, 3),
('food', 'dw_track_intake', 'Su takibi yap', 'Günlük su tüketimini kaydet', '📊', 10, 'easy', 'evening', 2, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'drink_water'), 1, 4),

-- ===================
-- GOAL: reduce_sugar (Şekeri Azalt)
-- ===================
('food', 'rs_no_soda', 'Gazlı içecek içme', 'Şekerli gazlı içeceklerden uzak dur', '🚫', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), 1, 1),
('food', 'rs_fruit_dessert', 'Tatlı yerine meyve ye', 'Şekerli tatlı yerine doğal meyve tercih et', '🍎', 15, 'medium', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), 1, 2),
('food', 'rs_read_labels', 'Etiket oku', 'Gizli şeker kontrolü yap', '🔍', 10, 'easy', 'anytime', 2, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), 0.5, 3),
('food', 'rs_no_sugar_coffee', 'Kahveyi şekersiz iç', 'Kahve ve çaya şeker ekleme', '☕', 10, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), 1, 4),
('food', 'rs_home_cooking', 'Evde yemek yap', 'Dışarıda yemek yerine evde pişir', '🏠', 20, 'hard', 'evening', 45, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), 1.5, 5),

-- ===================
-- GOAL: meal_prep (Haftalık Yemek Hazırlığı)
-- ===================
('food', 'mp_plan_menu', 'Haftalık menü planla', 'Gelecek haftanın yemek menüsünü hazırla', '📝', 15, 'medium', 'anytime', 15, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), 1, 1),
('food', 'mp_grocery_list', 'Market listesi hazırla', 'Menüye göre alışveriş listesi oluştur', '🛒', 10, 'easy', 'anytime', 10, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), 0.5, 2),
('food', 'mp_batch_cook', '3+ porsiyon yemek hazırla', 'Toplu yemek pişir ve sakla', '🍲', 30, 'hard', 'anytime', 90, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), 2, 3),
('food', 'mp_portion_containers', 'Öğünleri porsiyonla', 'Hazırlanan yemekleri kaplara böl', '📦', 10, 'easy', 'anytime', 20, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), 1, 4),
('food', 'mp_prep_veggies', 'Sebzeleri hazırla', 'Sebzeleri yıka, doğra ve sakla', '🥕', 15, 'medium', 'anytime', 30, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), 0.5, 5),

-- ===================
-- GOAL: protein_goal (Günlük Protein Hedefi)
-- ===================
('food', 'pg_protein_breakfast', 'Proteinli kahvaltı', '25-30g protein içeren kahvaltı yap', '🍳', 10, 'easy', 'morning', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), 30, 1),
('food', 'pg_protein_lunch', 'Proteinli öğle yemeği', 'Öğlen en az 30g protein al', '🥗', 10, 'easy', 'afternoon', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), 30, 2),
('food', 'pg_protein_dinner', 'Proteinli akşam yemeği', 'Akşam en az 30g protein al', '🍽️', 10, 'easy', 'evening', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), 30, 3),
('food', 'pg_protein_snack', 'Proteinli atıştırmalık', 'Ara öğünde protein ağırlıklı atıştır', '🥜', 10, 'medium', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), 15, 4),
('food', 'pg_track_protein', 'Protein takibi yap', 'Günlük protein alımını kaydet', '📊', 10, 'easy', 'evening', 3, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), 15, 5),

-- ===================
-- GOAL: eat_healthy (Sağlıklı Beslenme)
-- ===================
('food', 'eh_veggie_portions', '5 porsiyon sebze/meyve ye', 'Günlük sebze meyve hedefini tamamla', '🥦', 20, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), 1, 1),
('food', 'eh_whole_grains', 'Tam tahıl tüket', 'Beyaz ekmek yerine tam tahıl tercih et', '🌾', 10, 'easy', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), 1, 2),
('food', 'eh_mindful_eating', 'Bilinçli beslen', 'Telefonsuz, yavaş ve dikkatli ye', '🧘', 15, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), 1, 3),
('food', 'eh_no_junk', 'Abur cuburdan kaçın', 'Fast food ve paketli atıştırmalık yeme', '🚫', 20, 'hard', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), 1, 4),
('food', 'eh_home_meal', 'Evde yemek ye', 'En az 2 öğünü evde hazırla ve ye', '🏠', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), 1, 5),

-- =====================================================
-- SPORT CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: run_5k (5K Koşusu)
-- ===================
('sport', 'r5k_warmup', '5 dakika dinamik ısınma', 'Koşu öncesi dinamik germe ve ısınma', '🔥', 5, 'easy', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 0.5, 1),
('sport', 'r5k_easy_run', 'Easy pace koşu yap', '3-4 km rahat tempoda koşu', '🏃', 20, 'medium', 'anytime', 25, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 1, 2),
('sport', 'r5k_intervals', 'Interval antrenmanı yap', '400m x 4-6 tekrar, arada yürüyüş', '⚡', 25, 'hard', 'anytime', 30, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 1.5, 3),
('sport', 'r5k_tempo_run', 'Tempo koşusu yap', '15-20 dakika 5K pace''den 30sn yavaş', '💨', 25, 'hard', 'anytime', 25, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 1.5, 4),
('sport', 'r5k_stretching', 'Koşu sonrası stretching', '5-10 dakika statik germe', '🧘', 5, 'easy', 'anytime', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 0.5, 5),
('sport', 'r5k_time_trial', '5K zaman denemesi', 'Tam gaz 5K koş ve zamanı kaydet', '🏆', 35, 'hard', 'anytime', 35, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'run_5k'), 3, 6),

-- ===================
-- GOAL: daily_steps (Günlük 10.000 Adım)
-- ===================
('sport', 'ds_morning_walk', 'Sabah 10dk yürüyüş', 'Güne hareketle başla', '🌅', 10, 'easy', 'morning', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 1000, 1),
('sport', 'ds_stairs', 'Merdiven kullan', 'Asansör yerine merdivenle çık', '🪜', 5, 'easy', 'anytime', 3, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 500, 2),
('sport', 'ds_lunch_walk', 'Öğle yürüyüşü', 'Yemekten sonra 15dk yürü', '🚶', 10, 'easy', 'afternoon', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 1500, 3),
('sport', 'ds_brisk_walk', '30dk tempolu yürüyüş', 'Orta-yüksek tempoda yürüyüş yap', '💪', 20, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 3000, 4),
('sport', 'ds_evening_walk', 'Akşam yürüyüşü', '20dk akşam yürüyüşü tamamla', '🌆', 15, 'medium', 'evening', 20, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 2000, 5),
('sport', 'ds_active_day', 'Aktif gün geçir', 'Tüm günü hareket halinde tut', '🏃', 25, 'hard', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), 2000, 6),

-- ===================
-- GOAL: build_strength (Güç Artışı)
-- ===================
('sport', 'bs_compound_lift', 'Compound hareket yap', 'Squat, deadlift veya bench press çalış', '🏋️', 30, 'hard', 'anytime', 45, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'build_strength'), 1, 1),
('sport', 'bs_progressive_weight', 'Ağırlığı artır', 'Geçen haftadan daha fazla kaldır', '📈', 25, 'hard', 'anytime', 0, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'build_strength'), 1.5, 2),
('sport', 'bs_warmup_sets', 'Isınma setleri yap', 'Ana çalışma öncesi hafif ağırlıkla ısın', '🔥', 10, 'easy', 'anytime', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'build_strength'), 0.3, 3),
('sport', 'bs_rest_recovery', 'Dinlenme günü al', 'Kas gruplarına 48 saat dinlenme ver', '😴', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'build_strength'), 0.5, 4),
('sport', 'bs_log_workout', 'Antrenman kaydet', 'Set, tekrar ve ağırlıkları not al', '📝', 10, 'easy', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'build_strength'), 0.3, 5),

-- ===================
-- GOAL: weekly_workouts (Haftalık Antrenman)
-- ===================
('sport', 'ww_gym_session', 'Spor salonu seansı', '45+ dakika antrenman tamamla', '💪', 30, 'hard', 'anytime', 60, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'weekly_workouts'), 1, 1),
('sport', 'ww_home_workout', 'Ev antrenmanı', '30 dakika ev egzersizi yap', '🏠', 20, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'weekly_workouts'), 1, 2),
('sport', 'ww_cardio_day', 'Kardiyo günü', '30+ dakika kardiyo antrenmanı', '🏃', 25, 'medium', 'anytime', 35, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'weekly_workouts'), 1, 3),
('sport', 'ww_flexibility', 'Esneklik çalışması', 'Yoga veya stretching seansı', '🧘', 15, 'easy', 'anytime', 20, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'weekly_workouts'), 0.5, 4),

-- ===================
-- GOAL: flexibility (Esneklik Geliştirme)
-- ===================
('sport', 'fl_morning_stretch', 'Sabah germe egzersizi', '10dk tüm vücut germe ile güne başla', '🌅', 10, 'easy', 'morning', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'flexibility'), 1, 1),
('sport', 'fl_yoga_session', 'Yoga seansı', '20+ dakika yoga pratiği', '🧘‍♀️', 20, 'medium', 'anytime', 25, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'flexibility'), 1, 2),
('sport', 'fl_hip_mobility', 'Kalça mobilite çalışması', 'Kalça açıcı egzersizler yap', '🦵', 15, 'medium', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'flexibility'), 1, 3),
('sport', 'fl_evening_stretch', 'Akşam germeleri', 'Yatmadan önce gevşeme egzersizleri', '🌙', 10, 'easy', 'evening', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'flexibility'), 1, 4),
('sport', 'fl_foam_rolling', 'Foam roller kullan', 'Kas gruplarını foam roller ile gevşet', '🧴', 15, 'medium', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'flexibility'), 1, 5),

-- ===================
-- GOAL: lose_fat (Yağ Yakma)
-- ===================
('sport', 'lf_hiit', 'HIIT antrenmanı yap', '20-25dk yüksek yoğunluklu interval', '⚡', 30, 'hard', 'anytime', 25, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), 0.1, 1),
('sport', 'lf_steady_cardio', 'Düzenli kardiyo', '30-45dk orta tempoda kardiyo', '🏃', 25, 'medium', 'anytime', 40, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), 0.08, 2),
('sport', 'lf_morning_fasted', 'Aç karna kardiyo', 'Kahvaltı öncesi hafif kardio', '🌅', 20, 'medium', 'morning', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), 0.08, 3),
('sport', 'lf_strength_combo', 'Güç + kardiyo kombo', 'Ağırlık + kardiyo kombinasyonu', '💪', 30, 'hard', 'anytime', 50, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), 0.12, 4),
('sport', 'lf_neat_boost', 'NEAT artır', 'Gün boyunca hareket et, adım say', '🚶', 15, 'easy', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), 0.05, 5),

-- =====================================================
-- DEV CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: build_project (Proje Tamamla)
-- ===================
('dev', 'bp_daily_priorities', 'Günün 3 önceliğini belirle', 'En önemli 3 görevi sabah planla', '🎯', 10, 'easy', 'morning', 10, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.05, 1),
('dev', 'bp_deep_work', '90dk deep work blok', 'Kesintisiz odaklanmış çalışma seansı', '🧠', 35, 'hard', 'anytime', 90, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.2, 2),
('dev', 'bp_feature_complete', 'Bir feature bitir', 'Bir özelliği baştan sona tamamla', '✨', 40, 'hard', 'anytime', 120, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.3, 3),
('dev', 'bp_code_review', 'Code review yap/al', 'PR incelemesi yap veya feedback al', '👀', 20, 'medium', 'anytime', 30, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.1, 4),
('dev', 'bp_test_coverage', 'Test yaz', 'Yeni kod için unit test ekle', '🧪', 25, 'medium', 'anytime', 45, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.1, 5),
('dev', 'bp_documentation', 'Dokümantasyon güncelle', 'README veya inline docs ekle', '📖', 15, 'easy', 'evening', 20, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.08, 6),
('dev', 'bp_milestone_done', 'Milestone tamamla', 'Proje milestone''unu bitir', '🏆', 50, 'hard', 'anytime', 0, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'build_project'), 0.5, 7),

-- ===================
-- GOAL: daily_commits (Günlük Commit)
-- ===================
('dev', 'dc_ide_setup', 'Geliştirme ortamını hazırla', 'IDE aç, branch kontrol et', '💻', 5, 'easy', 'morning', 5, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), 0.1, 1),
('dev', 'dc_atomic_commit', 'Atomik commit yap', 'Küçük, anlamlı bir commit oluştur', '📦', 15, 'medium', 'anytime', 0, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), 1, 2),
('dev', 'dc_meaningful_message', 'Açıklayıcı commit mesajı', 'Ne yaptığını anlatan mesaj yaz', '✍️', 5, 'easy', 'anytime', 2, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), 0.2, 3),
('dev', 'dc_push_changes', 'Değişiklikleri push et', 'Günlük çalışmayı remote''a gönder', '⬆️', 10, 'easy', 'evening', 2, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), 0.3, 4),
('dev', 'dc_green_pipeline', 'CI/CD yeşil bırak', 'Build başarılı şekilde geçsin', '✅', 15, 'medium', 'evening', 5, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), 0.4, 5),

-- ===================
-- GOAL: learn_language (Yeni Dil Öğren)
-- ===================
('dev', 'll_daily_tutorial', 'Tutorial/dokümantasyon oku', '30dk yeni dil öğrenmeye ayır', '📚', 20, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'learn_language'), 1, 1),
('dev', 'll_hands_on', 'Pratik yap', 'Öğrendiklerini kodla', '⌨️', 25, 'medium', 'anytime', 45, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'learn_language'), 1, 2),
('dev', 'll_small_project', 'Mini proje yap', 'Yeni dilde küçük bir proje başlat', '🚀', 30, 'hard', 'anytime', 60, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'learn_language'), 2, 3),
('dev', 'll_watch_talk', 'Konferans/video izle', 'Dil hakkında eğitim videosu izle', '🎬', 15, 'easy', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'learn_language'), 0.5, 4),
('dev', 'll_notes', 'Öğrenme notları al', 'Önemli konuları not defterine yaz', '📝', 10, 'easy', 'evening', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'learn_language'), 0.5, 5),

-- ===================
-- GOAL: leetcode (Algoritma Pratiği)
-- ===================
('dev', 'lc_daily_problem', 'Günlük problem çöz', 'Bir algoritma problemi çöz', '🧩', 25, 'medium', 'anytime', 45, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'leetcode'), 1, 1),
('dev', 'lc_easy_warmup', 'Easy problem ile ısın', 'Kolay bir problem ile başla', '🟢', 10, 'easy', 'morning', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'leetcode'), 0.5, 2),
('dev', 'lc_medium_challenge', 'Medium problem çöz', 'Orta zorluk problem tamamla', '🟡', 25, 'medium', 'anytime', 45, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'leetcode'), 1, 3),
('dev', 'lc_hard_attempt', 'Hard problem dene', 'Zor bir problemle mücadele et', '🔴', 35, 'hard', 'anytime', 60, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'leetcode'), 2, 4),
('dev', 'lc_solution_review', 'Çözümleri incele', 'Başkalarının çözümlerini oku', '👀', 10, 'easy', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'leetcode'), 0.5, 5),

-- =====================================================
-- TRADE CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: trading_discipline (Trading Disiplini)
-- ===================
('trade', 'td_premarket_scan', 'Pre-market tarama yap', 'Futures, gece hareketleri ve haberleri incele', '📊', 15, 'medium', 'morning', 15, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 1, 1),
('trade', 'td_watchlist', 'Watchlist güncelle', 'Maksimum 5 sembol belirle', '📋', 10, 'easy', 'morning', 10, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 0.5, 2),
('trade', 'td_trading_plan', 'Günlük plan hazırla', 'Entry, exit ve stop-loss noktalarını belirle', '🎯', 20, 'medium', 'morning', 20, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 1, 3),
('trade', 'td_stick_to_plan', 'Plana sadık kal', 'İmpulsif trade yapma', '✅', 30, 'hard', 'anytime', 0, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 1.5, 4),
('trade', 'td_emotion_log', 'Duygu durumunu kaydet', 'Trading sırasında duygularını not al', '💭', 10, 'easy', 'anytime', 3, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 0.5, 5),
('trade', 'td_journal_entry', 'Trade journal yaz', 'Tüm işlemleri detaylı kaydet', '📝', 25, 'hard', 'evening', 20, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), 1, 6),

-- ===================
-- GOAL: risk_management (Risk Yönetimi)
-- ===================
('trade', 'rm_stop_loss', 'Stop-loss kontrol', 'Her pozisyon için stop-loss ayarla', '🛑', 15, 'medium', 'anytime', 5, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'risk_management'), 1, 1),
('trade', 'rm_position_size', 'Pozisyon büyüklüğü hesapla', 'Risk limitine (%1-2) göre lot hesapla', '📐', 15, 'medium', 'anytime', 5, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'risk_management'), 1, 2),
('trade', 'rm_rr_ratio', 'Risk/Reward oranı kaydet', 'En az 1:2 R/R hedefle', '⚖️', 10, 'easy', 'anytime', 3, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'risk_management'), 0.5, 3),
('trade', 'rm_max_daily_loss', 'Günlük max kaybı aşma', 'Belirlenen günlük kayıp limitine uy', '🚫', 30, 'hard', 'evening', 0, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'risk_management'), 2, 4),
('trade', 'rm_no_revenge', 'Revenge trade yapma', 'Kayıptan sonra sakin kal', '😤', 25, 'hard', 'anytime', 0, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'risk_management'), 1.5, 5),

-- ===================
-- GOAL: journal_habit (Trade Günlüğü)
-- ===================
('trade', 'jh_premarket_notes', 'Pre-market notları yaz', 'Sabah piyasa görünümünü kaydet', '📝', 10, 'easy', 'morning', 10, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), 1, 1),
('trade', 'jh_trade_entry', 'Her işlemi kaydet', 'Entry, exit, reasoning, PnL', '📊', 15, 'medium', 'anytime', 5, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), 1, 2),
('trade', 'jh_screenshot', 'Grafik screenshot al', 'Önemli seviyeleri görüntüle', '📸', 5, 'easy', 'anytime', 2, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), 0.5, 3),
('trade', 'jh_lessons', 'Öğrenilen dersleri yaz', 'Bugün ne öğrendin?', '🎓', 15, 'medium', 'evening', 10, true, 'weekdays', (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), 1, 4),
('trade', 'jh_weekly_review', 'Haftalık analiz yap', 'Haftayı değerlendir, istatistikleri incele', '📈', 25, 'hard', 'evening', 30, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), 2, 5),

-- =====================================================
-- ETSY CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: monthly_revenue (Aylık Gelir Hedefi)
-- ===================
('etsy', 'mr_stats_check', 'Mağaza istatistiklerini incele', 'Günlük view, favorite ve satış kontrolü', '📊', 10, 'easy', 'morning', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 5, 1),
('etsy', 'mr_reply_messages', 'Müşteri mesajlarına yanıt ver', 'Tüm mesajları 4 saat içinde yanıtla', '💬', 15, 'medium', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 5, 2),
('etsy', 'mr_seo_optimize', '2-3 listing optimize et', 'Keyword ve açıklama güncellemesi', '🎯', 25, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 10, 3),
('etsy', 'mr_social_post', 'Sosyal medya paylaşımı', 'Instagram/Pinterest''te ürün paylaş', '📱', 15, 'medium', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 10, 4),
('etsy', 'mr_ship_orders', 'Siparişleri zamanında gönder', 'Bekleyen siparişleri kargoya ver', '📦', 20, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 15, 5),
('etsy', 'mr_new_listing', 'Yeni ürün ekle', 'Mağazaya yeni listing ekle', '➕', 35, 'hard', 'anytime', 60, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), 25, 6),

-- ===================
-- GOAL: new_listings (Yeni Ürün Ekleme)
-- ===================
('etsy', 'nl_product_photo', 'Ürün fotoğrafı çek', '5-10 yüksek kalite fotoğraf hazırla', '📸', 25, 'hard', 'anytime', 45, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'new_listings'), 1, 1),
('etsy', 'nl_keyword_research', 'Keyword araştırması yap', 'eRank ile popüler kelimeleri bul', '🔍', 15, 'medium', 'anytime', 20, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'new_listings'), 0.5, 2),
('etsy', 'nl_write_description', 'Açıklama yaz', 'SEO uyumlu detaylı açıklama hazırla', '✍️', 20, 'medium', 'anytime', 30, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'new_listings'), 0.5, 3),
('etsy', 'nl_set_tags', '13 tag ekle', 'Tüm tag alanlarını kullan', '🏷️', 10, 'easy', 'anytime', 10, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'new_listings'), 0.3, 4),
('etsy', 'nl_publish', 'Listing yayınla', 'Yeni ürünü mağazaya ekle', '🚀', 15, 'medium', 'anytime', 5, false, NULL, (SELECT id FROM goal_templates WHERE slug = 'new_listings'), 1, 5),

-- =====================================================
-- GAMING CATEGORY: Goal-Specific Quests
-- =====================================================

-- ===================
-- GOAL: rank_up (Rank Yükseltme)
-- ===================
('gaming', 'ru_hand_stretch', 'El/bilek germe yap', 'Oyun öncesi esneme egzersizi', '🖐️', 5, 'easy', 'anytime', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.02, 1),
('gaming', 'ru_aim_trainer', '15dk aim trainer', 'Aim Lab veya Kovaak''s ile pratik', '🎯', 15, 'easy', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.05, 2),
('gaming', 'ru_warmup_match', 'Isınma maçı oyna', 'Düşük stresli casual/DM oyna', '🔥', 10, 'easy', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.03, 3),
('gaming', 'ru_ranked_session', '2+ saat ranked oyna', 'Competitive/ranked maçlar yap', '🏆', 30, 'hard', 'anytime', 120, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.1, 4),
('gaming', 'ru_vod_review', 'VOD analizi yap', 'Son maçını izle ve hatalarını bul', '📹', 20, 'medium', 'evening', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.08, 5),
('gaming', 'ru_win_match', 'Ranked maç kazan', 'Bir rekabetçi maç kazan', '🏅', 35, 'hard', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.15, 6),
('gaming', 'ru_tilt_break', 'Kötü streak''te mola ver', 'Üst üste kayıpta ara ver', '🧘', 15, 'medium', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'rank_up'), 0.05, 7),

-- ===================
-- GOAL: skill_improvement (Beceri Geliştirme)
-- ===================
('gaming', 'si_practice_session', 'Pratik seansı', '1 saat belirli skill çalış', '🎮', 25, 'medium', 'anytime', 60, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), 1, 1),
('gaming', 'si_mechanics_drill', 'Mekanik drill', 'Oyuna özel mekanik tekrar', '🔧', 20, 'medium', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), 0.5, 2),
('gaming', 'si_pro_vod', 'Pro gameplay izle', 'Profesyonel oyuncu izle ve öğren', '🎬', 15, 'easy', 'anytime', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), 0.5, 3),
('gaming', 'si_note_mistakes', 'Hataları not al', 'Yaptığın hataları kaydet', '📝', 10, 'easy', 'evening', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), 0.3, 4),
('gaming', 'si_improvement_goal', 'Günlük gelişim hedefi', 'Bugün ne geliştireceğini belirle', '🎯', 10, 'easy', 'morning', 5, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), 0.2, 5),

-- ===================
-- GOAL: stream_consistency (Yayın Tutarlılığı)
-- ===================
('gaming', 'sc_stream_prep', 'Yayın hazırlığı', 'Overlay, ses, kamera kontrol', '🎙️', 10, 'easy', 'anytime', 15, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), 0.5, 1),
('gaming', 'sc_go_live', 'Yayına başla', '2+ saat canlı yayın yap', '📺', 35, 'hard', 'anytime', 120, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), 1, 2),
('gaming', 'sc_chat_engage', 'Chat ile etkileşim', 'İzleyicilerle aktif iletişim kur', '💬', 15, 'medium', 'anytime', 0, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), 0.5, 3),
('gaming', 'sc_post_stream', 'Yayın sonrası özet', 'Highlights kliple ve paylaş', '🎬', 20, 'medium', 'evening', 30, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), 0.5, 4),
('gaming', 'sc_social_promo', 'Sosyal medya duyurusu', 'Yayını sosyal medyada duyur', '📱', 10, 'easy', 'anytime', 10, true, 'daily', (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), 0.3, 5)

ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji,
    xp_reward = EXCLUDED.xp_reward,
    difficulty = EXCLUDED.difficulty,
    time_of_day = EXCLUDED.time_of_day,
    estimated_minutes = EXCLUDED.estimated_minutes,
    is_recurring_default = EXCLUDED.is_recurring_default,
    recurrence_pattern = EXCLUDED.recurrence_pattern,
    goal_template_id = EXCLUDED.goal_template_id,
    progress_contribution = EXCLUDED.progress_contribution,
    sort_order = EXCLUDED.sort_order;

-- =====================================================
-- End of Migration
-- =====================================================

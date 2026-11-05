/**
 * Extended catalog: ~200 additional games in a compact, one-line-per-game format.
 *
 *   Title | first release YYYY-MM-DD | genres | tags | developers ; … | publishers ; … | engine |
 *   platforms (code or code@YYYY-MM-DD) | flags | director | composer
 *
 * Platform codes: ps4 ps5 xo (Xbox One) xs (Series X|S) sw sw2 pc mac
 * Flags: l=<load>  rt (PC ray tracing)  rtm (console RT mode)  rta (RT always on)  pro (PS5 Pro enhanced)
 *        dlss2 (Switch 2 DLSS)  c30/c60 (frame cap everywhere)  cc30 (console cap 30)  bal (balanced mode)
 *        2d (lightweight 2D)  nodeck (not playable on Steam Deck, e.g. anti-cheat)
 *
 * Credits are left empty ("") where not confidently known — the UI shows "—" rather than guessing.
 * Engines marked "—" are unknown. Performance figures for these games are generated demo data.
 */
export const EXTENDED_GAMES = `
Marvel's Spider-Man|2018-09-07|Action,Adventure|open-world,third-person,superhero|Insomniac Games|Sony Interactive Entertainment|Insomniac Engine|ps4,ps5@2020-11-12,pc@2022-08-12|l=0.8 rtm pro|Bryan Intihar|John Paesano
Marvel's Spider-Man: Miles Morales|2020-11-12|Action,Adventure|open-world,third-person,superhero|Insomniac Games|Sony Interactive Entertainment|Insomniac Engine|ps4,ps5,pc@2022-11-18|l=0.85 rtm pro||John Paesano
Ghost of Tsushima|2020-07-17|Action,Adventure|open-world,third-person,samurai|Sucker Punch Productions|Sony Interactive Entertainment|Sucker Punch in-house engine|ps4,ps5@2021-08-20,pc@2024-05-16|l=0.6 pro|Nate Fox & Jason Connell|Ilan Eshkeri & Shigeru Umebayashi
Ghost of Yōtei|2025-10-02|Action,Adventure|open-world,third-person,samurai|Sucker Punch Productions|Sony Interactive Entertainment|Sucker Punch in-house engine|ps5|l=0.95 pro rtm||
The Last of Us Part I|2022-09-02|Action,Adventure|third-person,story-rich,horror|Naughty Dog|Sony Interactive Entertainment|Naughty Dog in-house engine|ps5,pc@2023-03-28|l=1.0 pro||Gustavo Santaolalla
The Last of Us Part II Remastered|2024-01-19|Action,Adventure|third-person,story-rich,horror|Naughty Dog|Sony Interactive Entertainment|Naughty Dog in-house engine|ps5,pc@2025-04-03|l=0.95 pro|Neil Druckmann|Gustavo Santaolalla
Uncharted: Legacy of Thieves Collection|2022-01-28|Action,Adventure|third-person,linear,story-rich|Naughty Dog|Sony Interactive Entertainment|Naughty Dog in-house engine|ps5,pc@2022-10-19|l=0.75||
Horizon Zero Dawn Remastered|2024-10-31|Action,RPG|open-world,third-person,sci-fi|Nixxes Software;Guerrilla Games|Sony Interactive Entertainment|Decima|ps5,pc|l=0.9 pro||
Horizon Forbidden West|2022-02-18|Action,RPG|open-world,third-person,sci-fi|Guerrilla Games|Sony Interactive Entertainment|Decima|ps4,ps5,pc@2024-03-21|l=1.0 pro|Mathijs de Jonge|
Death Stranding Director's Cut|2021-09-24|Action,Adventure|open-world,third-person,story-rich|Kojima Productions|Sony Interactive Entertainment|Decima|ps5,pc@2022-03-30|l=0.75|Hideo Kojima|
Death Stranding 2: On the Beach|2025-06-26|Action,Adventure|open-world,third-person,story-rich|Kojima Productions|Sony Interactive Entertainment|Decima|ps5|l=1.0 pro|Hideo Kojima|
Ratchet & Clank: Rift Apart|2021-06-11|Action,Platformer|third-person,linear,family|Insomniac Games|Sony Interactive Entertainment|Insomniac Engine|ps5,pc@2023-07-26|l=1.0 rtm pro||
Returnal|2021-04-30|Shooter,Roguelike|third-person,sci-fi|Housemarque|Sony Interactive Entertainment|Unreal Engine 4|ps5,pc@2023-02-15|l=0.85 rt||
Demon's Souls|2020-11-12|Action,RPG|souls-like,third-person,fantasy|Bluepoint Games|Sony Interactive Entertainment|Bluepoint in-house engine|ps5|l=0.85||
Astro Bot|2024-09-06|Platformer|family,third-person|Team Asobi|Sony Interactive Entertainment|Team Asobi in-house engine|ps5|l=0.6|Nicolas Doucet|Kenneth C M Young
Gran Turismo 7|2022-03-04|Racing,Simulation|driving,multiplayer|Polyphony Digital|Sony Interactive Entertainment|Polyphony in-house engine|ps4,ps5|l=0.8 rtm pro|Kazunori Yamauchi|
Days Gone|2019-04-26|Action,Adventure|open-world,third-person,horror|Bend Studio|Sony Interactive Entertainment|Unreal Engine 4|ps4,pc@2021-05-18,ps5@2025-04-25|l=0.75||Nathan Whitehead
God of War (2018)|2018-04-20|Action,Adventure|third-person,mythology,story-rich|Santa Monica Studio|Sony Interactive Entertainment|Santa Monica Studio in-house engine|ps4,pc@2022-01-14|l=0.7|Cory Barlog|Bear McCreary
Stellar Blade|2024-04-26|Action|third-person,sci-fi|Shift Up|Sony Interactive Entertainment|Unreal Engine 4|ps5,pc@2025-06-11|l=0.8 pro|Kim Hyung-tae|
Helldivers 2|2024-02-08|Shooter|co-op,multiplayer,third-person|Arrowhead Game Studios|Sony Interactive Entertainment|Autodesk Stingray|ps5,pc,xs@2025-08-26|l=1.0||Wilbert Roget II
Rise of the Ronin|2024-03-22|Action,RPG|open-world,souls-like,samurai|Team Ninja|Sony Interactive Entertainment|Team Ninja in-house engine|ps5,pc@2025-03-11|l=0.9 rtm||
Final Fantasy VII Rebirth|2024-02-29|RPG,Action|open-world,third-person,story-rich|Square Enix|Square Enix|Unreal Engine 4|ps5,pc@2025-01-23|l=1.1 pro|Naoki Hamaguchi|
Final Fantasy VII Remake Intergrade|2021-06-10|RPG,Action|third-person,story-rich,linear|Square Enix|Square Enix|Unreal Engine 4|ps5,pc@2021-12-16|l=0.85|Tetsuya Nomura|
Final Fantasy XVI|2023-06-22|RPG,Action|third-person,story-rich,fantasy|Square Enix|Square Enix|Square Enix in-house engine|ps5,pc@2024-09-17|l=1.25 pro|Hiroshi Takai|Masayoshi Soken
Halo Infinite|2021-12-08|Shooter|first-person,multiplayer,sci-fi|343 Industries|Xbox Game Studios|Slipspace Engine|xo,xs,pc|l=0.9||
Gears 5|2019-09-10|Shooter|third-person,co-op,multiplayer|The Coalition|Xbox Game Studios|Unreal Engine 4|xo,xs,pc|l=0.8||
Forza Motorsport|2023-10-10|Racing,Simulation|driving,multiplayer|Turn 10 Studios|Xbox Game Studios|ForzaTech|xs,pc|l=1.1 rtm||
Microsoft Flight Simulator 2024|2024-11-19|Simulation|open-world|Asobo Studio|Xbox Game Studios|Asobo in-house engine|xs,pc|l=1.5||
Hi-Fi Rush|2023-01-25|Action|third-person,rhythm,linear|Tango Gameworks|Bethesda Softworks|Unreal Engine 4|xs,pc,ps5@2024-03-19|l=0.5|John Johanas|
Avowed|2025-02-18|RPG,Action|first-person,fantasy,story-rich|Obsidian Entertainment|Xbox Game Studios|Unreal Engine 5|xs,pc|l=1.35 rt|Carrie Patel|Venus Theory
South of Midnight|2025-04-08|Action,Adventure|third-person,story-rich|Compulsion Games|Xbox Game Studios|Unreal Engine|xs,pc|l=1.05||Olivier Deriviere
Sea of Thieves|2018-03-20|Adventure|co-op,multiplayer,open-world,first-person|Rare|Xbox Game Studios|Unreal Engine 4|xo,xs,pc,ps5@2024-04-30|l=0.55||Robin Beanland
Grounded|2022-09-27|Adventure,Simulation|co-op,survival,first-person|Obsidian Entertainment|Xbox Game Studios|Unreal Engine 4|xo,xs,pc,ps5@2024-04-16,sw@2024-04-16|l=0.6||
Ori and the Will of the Wisps|2020-03-11|Platformer|metroidvania,2d|Moon Studios|Xbox Game Studios|Unity|xo,xs,pc,sw@2020-09-17|l=0.25||Gareth Coker
Psychonauts 2|2021-08-25|Platformer,Adventure|third-person,story-rich|Double Fine|Xbox Game Studios|Unreal Engine 4|xo,xs,pc,ps4|l=0.55|Tim Schafer|Peter McConnell
Age of Empires IV|2021-10-28|Strategy|real-time,multiplayer|Relic Entertainment|Xbox Game Studios|Essence Engine|pc,xs@2023-08-29|l=0.6||
Senua's Saga: Hellblade II|2024-05-21|Action,Adventure|third-person,story-rich,linear|Ninja Theory|Xbox Game Studios|Unreal Engine 5|xs,pc,ps5@2025-08-12|l=1.5 rt cc30||
Ninja Gaiden 2 Black|2025-01-23|Action|third-person,linear|Team Ninja|Koei Tecmo|Unreal Engine 5|ps5,xs,pc|l=1.1||
Doom Eternal|2020-03-20|Shooter|first-person,fast-paced,linear|id Software|Bethesda Softworks|id Tech 7|ps4,xo,pc,sw@2020-12-08,ps5@2021-06-29,xs@2021-06-29|l=0.55 rtm|Hugo Martin|Mick Gordon
Doom (2016)|2016-05-13|Shooter|first-person,fast-paced,linear|id Software|Bethesda Softworks|id Tech 6|ps4,xo,pc,sw@2017-11-10|l=0.45||Mick Gordon
Wolfenstein II: The New Colossus|2017-10-27|Shooter|first-person,story-rich,linear|MachineGames|Bethesda Softworks|id Tech 6|ps4,xo,pc,sw@2018-06-29|l=0.5||Mick Gordon & Martin Stig Andersen
Fallout 4|2015-11-10|RPG,Shooter|open-world,first-person,sci-fi|Bethesda Game Studios|Bethesda Softworks|Creation Engine|ps4,xo,pc,ps5@2024-04-25,xs@2024-04-25|l=0.55|Todd Howard|Inon Zur
The Elder Scrolls V: Skyrim Special Edition|2016-10-28|RPG|open-world,first-person,fantasy|Bethesda Game Studios|Bethesda Softworks|Creation Engine|ps4,xo,pc,sw@2017-11-17,ps5@2021-11-11,xs@2021-11-11|l=0.4|Todd Howard|Jeremy Soule
The Elder Scrolls IV: Oblivion Remastered|2025-04-22|RPG|open-world,first-person,fantasy|Virtuos;Bethesda Game Studios|Bethesda Softworks|Unreal Engine 5|ps5,xs,pc|l=1.45 rt||
Deathloop|2021-09-14|Shooter,Action|first-person,stealth|Arkane Lyon|Bethesda Softworks|Void Engine|ps5,pc,xs@2022-09-20|l=0.8 rtm|Dinga Bakaba|Tom Salta
The Legend of Zelda: Breath of the Wild|2017-03-03|Adventure,Action|open-world,third-person,fantasy|Nintendo EPD|Nintendo|Nintendo in-house engine|sw,sw2@2025-06-05|l=0.09 c30 s2_60|Hidemaro Fujibayashi|Manaka Kataoka
Super Mario Odyssey|2017-10-27|Platformer|third-person,family|Nintendo EPD|Nintendo|Nintendo in-house engine|sw|l=0.08 c60|Kenta Motokura|Naoto Kubo & Shiho Fujii
Super Mario Bros. Wonder|2023-10-20|Platformer|2d,family,co-op|Nintendo EPD|Nintendo|Nintendo in-house engine|sw|l=0.06 c60|Shiro Mouri|Koji Kondo
Mario Kart 8 Deluxe|2017-04-28|Racing|multiplayer,family,driving|Nintendo EPD|Nintendo|Nintendo in-house engine|sw|l=0.07 c60||
Animal Crossing: New Horizons|2020-03-20|Simulation|family,cozy|Nintendo EPD|Nintendo|Nintendo in-house engine|sw|l=0.08 c30||
Super Smash Bros. Ultimate|2018-12-07|Fighting|multiplayer,family|Bandai Namco Studios;Sora Ltd.|Nintendo|—|sw|l=0.06 c60|Masahiro Sakurai|
Metroid Dread|2021-10-08|Action,Platformer|metroidvania,2d,sci-fi|MercurySteam;Nintendo EPD|Nintendo|—|sw|l=0.06 c60||
Metroid Prime 4: Beyond|2025-12-04|Shooter,Adventure|first-person,sci-fi|Retro Studios|Nintendo|—|sw,sw2|l=0.1 c60||
Xenoblade Chronicles 3|2022-07-29|RPG|open-world,story-rich,fantasy|Monolith Soft|Nintendo|Monolith Soft in-house engine|sw|l=0.11 c30|Tetsuya Takahashi|
Splatoon 3|2022-09-09|Shooter|third-person,multiplayer,family|Nintendo EPD|Nintendo|Nintendo in-house engine|sw|l=0.07 c60||
Pokémon Scarlet and Violet|2022-11-18|RPG|open-world,family,multiplayer|Game Freak|Nintendo;The Pokémon Company|Game Freak in-house engine|sw|l=0.13 c30||
Pokémon Legends: Z-A|2025-10-16|RPG,Action|family,third-person|Game Freak|Nintendo;The Pokémon Company|Game Freak in-house engine|sw,sw2|l=0.1 c60||
Donkey Kong Bananza|2025-07-17|Platformer|third-person,family|Nintendo EPD|Nintendo|Nintendo in-house engine|sw2|l=0.3 c60||
Kirby and the Forgotten Land|2022-03-25|Platformer|third-person,family|HAL Laboratory|Nintendo|HAL in-house engine|sw,sw2@2025-08-28|l=0.08 c30||
Fire Emblem: Three Houses|2019-07-26|Strategy,RPG|turn-based,story-rich|Intelligent Systems;Koei Tecmo|Nintendo|—|sw|l=0.08 c30||
Luigi's Mansion 3|2019-10-31|Adventure|third-person,family,co-op|Next Level Games|Nintendo|Next Level Games in-house engine|sw|l=0.08 c30||
The Legend of Zelda: Echoes of Wisdom|2024-09-26|Adventure|top-down,puzzle,family|Grezzo|Nintendo|—|sw|l=0.08 c60||
Pikmin 4|2023-07-21|Strategy,Adventure|family,puzzle|Nintendo EPD|Nintendo|Unreal Engine 4|sw|l=0.08 c30||
Grand Theft Auto V|2013-09-17|Action,Adventure|open-world,third-person,multiplayer|Rockstar North|Rockstar Games|RAGE|ps4@2014-11-18,xo@2014-11-18,pc@2015-04-14,ps5@2022-03-15,xs@2022-03-15|l=0.45 rtm||
Assassin's Creed Shadows|2025-03-20|Action,RPG|open-world,third-person,stealth,samurai|Ubisoft Quebec|Ubisoft|Anvil|ps5,xs,pc,mac|l=1.3 rtm rt pro bal||
Assassin's Creed Valhalla|2020-11-10|Action,RPG|open-world,third-person|Ubisoft Montreal|Ubisoft|Anvil|ps4,ps5,xo,xs,pc|l=0.85||Jesper Kyd, Sarah Schachner & Einar Selvik
Assassin's Creed Mirage|2023-10-05|Action,Adventure|open-world,third-person,stealth|Ubisoft Bordeaux|Ubisoft|Anvil|ps4,ps5,xo,xs,pc|l=0.8||Brendan Angelides
Assassin's Creed Odyssey|2018-10-05|Action,RPG|open-world,third-person|Ubisoft Quebec|Ubisoft|Anvil|ps4,xo,pc|l=0.75||
Far Cry 6|2021-10-07|Shooter|open-world,first-person,co-op|Ubisoft Toronto|Ubisoft|Dunia|ps4,ps5,xo,xs,pc|l=0.9 rt||
Avatar: Frontiers of Pandora|2023-12-07|Action,Adventure|open-world,first-person,sci-fi|Massive Entertainment|Ubisoft|Snowdrop|ps5,xs,pc|l=1.35 rt||
Star Wars Outlaws|2024-08-30|Action,Adventure|open-world,third-person,sci-fi,stealth|Massive Entertainment|Ubisoft|Snowdrop|ps5,xs,pc,sw2@2025-09-04|l=1.35 rt pro dlss2||
Prince of Persia: The Lost Crown|2024-01-18|Action,Platformer|metroidvania,2d|Ubisoft Montpellier|Ubisoft|Unity|ps4,ps5,xo,xs,sw,pc|l=0.12 c60||
Watch Dogs: Legion|2020-10-29|Action,Adventure|open-world,third-person|Ubisoft Toronto|Ubisoft|Disrupt|ps4,ps5,xo,xs,pc|l=0.95 rtm||
Tom Clancy's Rainbow Six Siege|2015-12-01|Shooter|first-person,multiplayer,competitive|Ubisoft Montreal|Ubisoft|AnvilNext 2.0|ps4,xo,pc,ps5@2020-12-01,xs@2020-12-01|l=0.35 nodeck||
Mario + Rabbids Sparks of Hope|2022-10-20|Strategy|turn-based,family|Ubisoft Milan;Ubisoft Paris|Ubisoft|Snowdrop|sw|l=0.1 c30||Grant Kirkhope, Yoko Shimomura & Gareth Coker
EA Sports FC 25|2024-09-27|Sports|multiplayer,football|EA Vancouver;EA Romania|Electronic Arts|Frostbite|ps4,ps5,xo,xs,sw,pc|l=0.7 c60 nodeck||
Battlefield 2042|2021-11-19|Shooter|first-person,multiplayer|DICE|Electronic Arts|Frostbite|ps4,ps5,xo,xs,pc|l=1.0 rt nodeck||
Battlefield 6|2025-10-10|Shooter|first-person,multiplayer|Battlefield Studios|Electronic Arts|Frostbite|ps5,xs,pc|l=1.1 nodeck||
Star Wars Jedi: Survivor|2023-04-28|Action,Adventure|third-person,souls-like,sci-fi|Respawn Entertainment|Electronic Arts|Unreal Engine 4|ps5,xs,pc|l=1.25 rtm rt||Stephen Barton & Gordy Haab
Star Wars Jedi: Fallen Order|2019-11-15|Action,Adventure|third-person,souls-like,sci-fi|Respawn Entertainment|Electronic Arts|Unreal Engine 4|ps4,xo,pc,ps5@2021-06-11,xs@2021-06-11|l=0.65||Stephen Barton & Gordy Haab
Apex Legends|2019-02-04|Shooter|first-person,multiplayer,battle-royale|Respawn Entertainment|Electronic Arts|Source (modified)|ps4,xo,pc,sw@2021-03-09,ps5@2022-03-29,xs@2022-03-29|l=0.45||
Dead Space|2023-01-27|Horror,Action|third-person,sci-fi,linear|Motive Studio|Electronic Arts|Frostbite|ps5,xs,pc|l=1.05 rt||
Mass Effect Legendary Edition|2021-05-14|RPG,Shooter|third-person,sci-fi,story-rich|BioWare|Electronic Arts|Unreal Engine 3|ps4,xo,pc|l=0.35||
Dragon Age: The Veilguard|2024-10-31|RPG,Action|third-person,fantasy,story-rich|BioWare|Electronic Arts|Frostbite|ps5,xs,pc|l=1.1 rt rtm||Hans Zimmer & Lorne Balfe
It Takes Two|2021-03-26|Platformer,Adventure|co-op,story-rich|Hazelight Studios|Electronic Arts|Unreal Engine 4|ps4,ps5,xo,xs,pc,sw@2022-11-04|l=0.55|Josef Fares|
Split Fiction|2025-03-06|Platformer,Adventure|co-op,story-rich,sci-fi|Hazelight Studios|Electronic Arts|Unreal Engine 5|ps5,xs,pc,sw2@2025-06-05|l=0.95 dlss2|Josef Fares|
F1 25|2025-05-30|Racing,Sports|driving,simulation|Codemasters|Electronic Arts|EGO Engine|ps5,xs,pc|l=0.9 rt||
Need for Speed Unbound|2022-12-02|Racing|open-world,driving,multiplayer|Criterion Games|Electronic Arts|Frostbite|ps5,xs,pc|l=0.85||
Titanfall 2|2016-10-28|Shooter|first-person,story-rich,multiplayer|Respawn Entertainment|Electronic Arts|Source (modified)|ps4,xo,pc|l=0.4||Stephen Barton
Call of Duty: Modern Warfare III|2023-11-10|Shooter|first-person,multiplayer|Sledgehammer Games|Activision|IW Engine|ps4,ps5,xo,xs,pc|l=0.95 nodeck||
Call of Duty: Black Ops 6|2024-10-25|Shooter|first-person,multiplayer|Treyarch;Raven Software|Activision|IW Engine|ps4,ps5,xo,xs,pc|l=1.0 nodeck||
Diablo IV|2023-06-06|RPG,Action|isometric,multiplayer,co-op|Blizzard Entertainment|Blizzard Entertainment|Blizzard in-house engine|ps4,ps5,xo,xs,pc|l=0.75 rt||
Overwatch 2|2022-10-04|Shooter|first-person,multiplayer,competitive|Blizzard Entertainment|Blizzard Entertainment|Blizzard in-house engine|ps4,ps5,xo,xs,sw,pc|l=0.45||
Crash Bandicoot 4: It's About Time|2020-10-02|Platformer|third-person,family|Toys for Bob|Activision|—|ps4,xo,ps5@2021-03-12,xs@2021-03-12,sw@2021-03-12,pc@2021-03-26|l=0.5||
Tony Hawk's Pro Skater 1 + 2|2020-09-04|Sports|skateboarding,multiplayer|Vicarious Visions|Activision|Unreal Engine 4|ps4,xo,pc,ps5@2021-03-26,xs@2021-03-26,sw@2021-06-25|l=0.45||
Sekiro: Shadows Die Twice|2019-03-22|Action,Adventure|souls-like,third-person,samurai|FromSoftware|Activision|FromSoftware in-house engine|ps4,xo,pc|l=0.55 c60|Hidetaka Miyazaki|Yuka Kitamura
Dark Souls III|2016-04-12|Action,RPG|souls-like,third-person,fantasy|FromSoftware|Bandai Namco Entertainment|FromSoftware in-house engine|ps4,xo,pc|l=0.45 c60|Hidetaka Miyazaki|Yuka Kitamura & Motoi Sakuraba
Dark Souls Remastered|2018-05-25|Action,RPG|souls-like,third-person,fantasy|FromSoftware|Bandai Namco Entertainment|FromSoftware in-house engine|ps4,xo,pc,sw@2018-10-19|l=0.25 c60|Hidetaka Miyazaki|Motoi Sakuraba
Armored Core VI: Fires of Rubicon|2023-08-25|Action|third-person,mech,sci-fi|FromSoftware|Bandai Namco Entertainment|FromSoftware in-house engine|ps4,ps5,xo,xs,pc|l=0.75 c60 rt|Masaru Yamamura|
Elden Ring Nightreign|2025-05-30|Action,Roguelike|souls-like,co-op,fantasy|FromSoftware|Bandai Namco Entertainment|FromSoftware in-house engine|ps4,ps5,xo,xs,pc|l=0.8 c60|Junya Ishizaki|
Tekken 8|2024-01-26|Fighting|multiplayer,competitive|Bandai Namco Studios|Bandai Namco Entertainment|Unreal Engine 5|ps5,xs,pc|l=0.95 c60||
Little Nightmares II|2021-02-11|Horror,Platformer|puzzle,linear|Tarsier Studios|Bandai Namco Entertainment|Unreal Engine 4|ps4,xo,sw,pc,ps5@2021-11-17,xs@2021-11-17|l=0.35||Tobias Lilja
Resident Evil 4|2023-03-24|Horror,Action|third-person,linear|Capcom|Capcom|RE Engine|ps4,ps5,xs,pc,mac@2023-12-20|l=0.95 rtm pro|Yasuhiro Seto|
Resident Evil Village|2021-05-07|Horror,Action|first-person,linear|Capcom|Capcom|RE Engine|ps4,ps5,xo,xs,pc,mac@2022-10-28|l=0.8 rtm|Morimasa Sato|
Resident Evil 2|2019-01-25|Horror,Action|third-person,linear|Capcom|Capcom|RE Engine|ps4,xo,pc,ps5@2022-06-13,xs@2022-06-13|l=0.6 rtm|Kazunori Kadoi & Yasuhiro Seto|
Resident Evil 3|2020-04-03|Horror,Action|third-person,linear|Capcom|Capcom|RE Engine|ps4,xo,pc,ps5@2022-06-13,xs@2022-06-13|l=0.6 rtm||
Resident Evil 7: Biohazard|2017-01-24|Horror|first-person,linear|Capcom|Capcom|RE Engine|ps4,xo,pc,ps5@2022-06-13,xs@2022-06-13|l=0.45 rtm|Koshi Nakanishi|
Devil May Cry 5|2019-03-08|Action|third-person,linear|Capcom|Capcom|RE Engine|ps4,xo,pc,ps5@2020-11-10,xs@2020-11-10|l=0.55 rtm|Hideaki Itsuno|
Street Fighter 6|2023-06-02|Fighting|multiplayer,competitive|Capcom|Capcom|RE Engine|ps4,ps5,xs,pc,sw2@2025-06-05|l=0.6 c60|Takayuki Nakayama|
Monster Hunter Rise|2021-03-26|Action,RPG|co-op,third-person,multiplayer|Capcom|Capcom|RE Engine|sw,pc@2022-01-12,ps4@2023-01-20,ps5@2023-01-20,xo@2023-01-20,xs@2023-01-20|l=0.3|Yasunori Ichinose|
Monster Hunter: World|2018-01-26|Action,RPG|co-op,third-person,multiplayer|Capcom|Capcom|MT Framework|ps4,xo,pc@2018-08-09|l=0.6|Yuya Tokuda|
Dragon's Dogma 2|2024-03-22|RPG,Action|open-world,third-person,fantasy|Capcom|Capcom|RE Engine|ps5,xs,pc|l=1.3 rt|Hideaki Itsuno|
Dragon Quest XI S: Echoes of an Elusive Age|2019-09-27|RPG|turn-based,fantasy,story-rich|Square Enix|Square Enix|Unreal Engine 4|sw,ps4@2020-12-04,xo@2020-12-04,pc@2020-12-04|l=0.3||Koichi Sugiyama
Octopath Traveler II|2023-02-24|RPG|turn-based,hd-2d,fantasy|Square Enix;Acquire|Square Enix|Unreal Engine 4|ps4,ps5,sw,pc,xo@2024-06-06,xs@2024-06-06|l=0.2||Yasunori Nishiki
Kingdom Hearts III|2019-01-29|RPG,Action|third-person,fantasy|Square Enix|Square Enix|Unreal Engine 4|ps4,xo,pc@2021-03-30|l=0.55|Tetsuya Nomura|Yoko Shimomura
NieR: Automata|2017-02-23|Action,RPG|third-person,story-rich,sci-fi|PlatinumGames|Square Enix|PlatinumGames in-house engine|ps4,pc@2017-03-17,xo@2018-06-26,sw@2022-10-06|l=0.4|Yoko Taro|Keiichi Okabe
Dragon Quest III HD-2D Remake|2024-11-14|RPG|turn-based,hd-2d,fantasy|Team Asano|Square Enix|Unreal Engine 4|ps5,xs,sw,pc|l=0.25||Koichi Sugiyama
Persona 5 Royal|2020-03-31|RPG|turn-based,story-rich|Atlus|Sega|Atlus in-house engine|ps4,ps5@2022-10-21,xo@2022-10-21,xs@2022-10-21,sw@2022-10-21,pc@2022-10-21|l=0.25|Katsura Hashino|Shoji Meguro
Persona 3 Reload|2024-02-02|RPG|turn-based,story-rich|Atlus|Sega|Unreal Engine 4|ps4,ps5,xo,xs,pc|l=0.45||
Metaphor: ReFantazio|2024-10-11|RPG|turn-based,fantasy,story-rich|Studio Zero|Sega|—|ps4,ps5,xs,pc|l=0.45|Katsura Hashino|Shoji Meguro
Like a Dragon: Infinite Wealth|2024-01-26|RPG|turn-based,open-world,story-rich|Ryu Ga Gotoku Studio|Sega|Dragon Engine|ps4,ps5,xo,xs,pc|l=0.6||
Yakuza 0|2017-01-24|Action,Adventure|open-world,third-person,story-rich|Ryu Ga Gotoku Studio|Sega|—|ps4,pc@2018-08-01,sw2@2025-06-05|l=0.25||
Sonic Frontiers|2022-11-08|Platformer,Action|open-world,third-person|Sonic Team|Sega|Hedgehog Engine 2|ps4,ps5,xo,xs,sw,pc|l=0.6||Tomoya Ohtani
Total War: Warhammer III|2022-02-17|Strategy|real-time,turn-based,fantasy|Creative Assembly|Sega|TW Engine 3|pc|l=0.9||
Hades|2020-09-17|Action,Roguelike|isometric,indie,mythology|Supergiant Games|Supergiant Games|Supergiant in-house engine|pc,sw,ps4@2021-08-13,ps5@2021-08-13,xo@2021-08-13,xs@2021-08-13|2d l=0.1|Greg Kasavin|Darren Korb
Hades II|2025-09-25|Action,Roguelike|isometric,indie,mythology|Supergiant Games|Supergiant Games|Supergiant in-house engine|pc,sw,sw2|2d l=0.12|Greg Kasavin|Darren Korb
Hollow Knight|2017-02-24|Action,Platformer|metroidvania,2d,indie,hand-drawn|Team Cherry|Team Cherry|Unity|pc,mac,sw@2018-06-12,ps4@2018-09-25,xo@2018-09-25|2d||Christopher Larkin
Celeste|2018-01-25|Platformer|2d,indie,pixel-art|Maddy Makes Games|Maddy Makes Games|XNA / FNA|pc,sw,ps4,xo|2d|Maddy Thorson|Lena Raine
Stardew Valley|2016-02-26|Simulation,RPG|2d,indie,co-op,cozy,pixel-art|ConcernedApe|ConcernedApe|XNA / MonoGame|pc,ps4@2016-12-13,xo@2016-12-13,sw@2017-10-05|2d|Eric Barone|Eric Barone
Terraria|2011-05-16|Adventure,Action|2d,indie,co-op,sandbox|Re-Logic|Re-Logic|XNA / FNA|pc,ps4@2014-11-11,xo@2014-11-11,sw@2019-06-27|2d||Scott Lloyd Shelly
Minecraft|2011-11-18|Adventure,Simulation|sandbox,co-op,first-person,family|Mojang Studios|Xbox Game Studios|Bedrock Engine|pc,ps4,xo,sw,ps5@2024-10-22|l=0.3 rt||C418 & Lena Raine
Cuphead|2017-09-29|Action,Platformer|2d,indie,co-op,hand-drawn|Studio MDHR|Studio MDHR|Unity|pc,xo,sw@2019-04-18,ps4@2020-07-28|2d||Kristofer Maddigan
Dead Cells|2018-08-07|Action,Roguelike|metroidvania,2d,indie|Motion Twin;Evil Empire|Motion Twin|Heaps|pc,ps4,xo,sw|2d||Yoann Laulan
Disco Elysium: The Final Cut|2021-03-30|RPG|isometric,story-rich,indie|ZA/UM|ZA/UM|Unity|pc,ps4,ps5,xo@2021-10-12,xs@2021-10-12,sw@2021-10-12|l=0.15|Robert Kurvitz|British Sea Power
Outer Wilds|2019-05-28|Adventure,Puzzle|first-person,indie,sci-fi|Mobius Digital|Annapurna Interactive|Unity|pc,xo,ps4@2019-10-15,ps5@2022-09-15,xs@2022-09-15,sw@2023-12-07|l=0.3|Alex Beachum|Andrew Prahlow
Inside|2016-06-29|Platformer,Puzzle|2d,indie,horror|Playdead|Playdead|Unity|xo,pc@2016-07-07,ps4@2016-08-23,sw@2018-06-28|2d l=0.12||Martin Stig Andersen
Balatro|2024-02-20|Strategy,Roguelike|card-game,indie|LocalThunk|Playstack|LÖVE|pc,ps4,ps5,xo,xs,sw,mac|2d||
Vampire Survivors|2022-10-20|Action,Roguelike|2d,indie,pixel-art|poncle|poncle|Unity|pc,xo@2022-11-10,xs@2022-11-10,sw@2023-08-17,ps4@2023-08-30,ps5@2023-08-30|2d||
Lies of P|2023-09-19|Action,RPG|souls-like,third-person|Neowiz;Round8 Studio|Neowiz|Unreal Engine 4|ps4,ps5,xo,xs,pc,mac|l=0.7||
Sifu|2022-02-08|Action|third-person,martial-arts|Sloclap|Sloclap|Unreal Engine 4|ps4,ps5,pc,sw@2022-11-08,xo@2022-11-08,xs@2022-11-08|l=0.45||Howie Lee
Tunic|2022-03-16|Action,Adventure|isometric,indie,puzzle|Andrew Shouldice|Finji|Unity|pc,xo,xs,ps4@2022-09-27,ps5@2022-09-27,sw@2022-09-27|l=0.2|Andrew Shouldice|Lifeformed & Janice Kwan
Cult of the Lamb|2022-08-11|Action,Roguelike|indie,cozy,co-op|Massive Monster|Devolver Digital|Unity|pc,ps4,ps5,xo,xs,sw|l=0.15||River Boy
Dave the Diver|2023-06-28|Adventure,Simulation|2d,indie,pixel-art,cozy|Mintrocket|Mintrocket|Unity|pc,mac,sw@2023-10-26,ps4@2024-04-16,ps5@2024-04-16|2d||
Sea of Stars|2023-08-29|RPG|turn-based,indie,pixel-art|Sabotage Studio|Sabotage Studio|Unity|pc,ps4,ps5,sw,xo,xs|2d|Thierry Boulanger|Eric W. Brown & Yasunori Mitsuda
Palworld|2024-01-19|Adventure,Action|open-world,survival,co-op|Pocketpair|Pocketpair|Unreal Engine 5|pc,xo,xs,ps5@2024-09-25|l=0.85||
Valheim|2021-02-02|Adventure,Action|open-world,survival,co-op|Iron Gate Studio|Coffee Stain Publishing|Unity|pc,xs@2023-03-14|l=0.45||
Satisfactory|2024-09-10|Simulation,Strategy|first-person,co-op,factory|Coffee Stain Studios|Coffee Stain Publishing|Unreal Engine 5|pc|l=1.0||
Clair Obscur: Expedition 33|2025-04-24|RPG|turn-based,third-person,story-rich,fantasy|Sandfall Interactive|Kepler Interactive|Unreal Engine 5|ps5,xs,pc|l=1.1 pro|Guillaume Broche|Lorien Testard
Kingdom Come: Deliverance II|2025-02-04|RPG,Action|open-world,first-person,medieval,story-rich|Warhorse Studios|Deep Silver|CryEngine|ps5,xs,pc|l=0.95 pro|Daniel Vávra|Jan Valta & Adam Sporka
Kingdom Come: Deliverance|2018-02-13|RPG,Action|open-world,first-person,medieval|Warhorse Studios|Deep Silver|CryEngine|ps4,xo,pc|l=0.6|Daniel Vávra|Jan Valta
Metro Exodus Enhanced Edition|2019-02-15|Shooter,Horror|first-person,story-rich,post-apocalyptic|4A Games|Deep Silver|4A Engine|ps4,xo,pc,ps5@2021-06-18,xs@2021-06-18|l=0.95 rta||Alexey Omelchuk
A Plague Tale: Requiem|2022-10-18|Adventure,Action|third-person,stealth,story-rich|Asobo Studio|Focus Entertainment|Asobo in-house engine|ps5,xs,pc|l=1.2 rt||Olivier Deriviere
S.T.A.L.K.E.R. 2: Heart of Chornobyl|2024-11-20|Shooter,RPG|open-world,first-person,survival|GSC Game World|GSC Game World|Unreal Engine 5|xs,pc|l=1.5||
Divinity: Original Sin 2|2017-09-14|RPG,Strategy|turn-based,isometric,co-op|Larian Studios|Larian Studios|Divinity Engine|pc,ps4@2018-08-31,xo@2018-08-31,sw@2019-09-04,mac@2019-05-28|l=0.3|Swen Vincke|Borislav Slavov
Pathfinder: Wrath of the Righteous|2021-09-02|RPG|isometric,turn-based,fantasy|Owlcat Games|META Publishing|Unity|pc,ps4@2022-09-29,xo@2022-09-29|l=0.3||
Genshin Impact|2020-09-28|RPG,Action|open-world,third-person,co-op,anime|HoYoverse|HoYoverse|Unity|pc,ps4,ps5@2021-04-28,xs@2024-11-20|l=0.35||Yu-Peng Chen
Honkai: Star Rail|2023-04-26|RPG|turn-based,anime,sci-fi|HoYoverse|HoYoverse|Unity|pc,ps5@2023-10-11|l=0.3||
Fortnite|2017-07-21|Shooter|third-person,multiplayer,battle-royale,co-op|Epic Games|Epic Games|Unreal Engine 5|ps4,ps5,xo,xs,sw,pc,sw2@2025-06-05|l=0.9 rt nodeck||
Rocket League|2015-07-07|Sports,Racing|multiplayer,competitive,driving|Psyonix|Epic Games|Unreal Engine 3|pc,ps4,xo@2016-02-17,sw@2017-11-14|l=0.2||
Counter-Strike 2|2023-09-27|Shooter|first-person,multiplayer,competitive|Valve|Valve|Source 2|pc|l=0.5||
Dota 2|2013-07-09|Strategy|moba,multiplayer,competitive|Valve|Valve|Source 2|pc,mac|l=0.3||
Half-Life 2|2004-11-16|Shooter|first-person,story-rich,linear|Valve|Valve|Source|pc|l=0.05||Kelly Bailey
Portal 2|2011-04-19|Puzzle|first-person,co-op,story-rich|Valve|Valve|Source|pc,mac|l=0.07||Mike Morasky
Valorant|2020-06-02|Shooter|first-person,multiplayer,competitive|Riot Games|Riot Games|Unreal Engine 4|pc|l=0.25 nodeck||
League of Legends|2009-10-27|Strategy|moba,multiplayer,competitive|Riot Games|Riot Games|Riot in-house engine|pc,mac|l=0.15 nodeck||
Destiny 2|2017-09-06|Shooter|first-person,multiplayer,co-op,sci-fi|Bungie|Bungie|Tiger Engine|ps4,xo,pc@2017-10-24,ps5@2020-12-08,xs@2020-12-08|l=0.55 nodeck||
Marvel Rivals|2024-12-06|Shooter|third-person,multiplayer,competitive,superhero|NetEase Games|NetEase Games|Unreal Engine 5|ps5,xs,pc|l=1.0||
Warframe|2013-03-25|Shooter,Action|third-person,co-op,multiplayer,sci-fi|Digital Extremes|Digital Extremes|Evolution Engine|pc,ps4,xo,sw,ps5,xs|l=0.35||
Path of Exile 2|2024-12-06|RPG,Action|isometric,co-op,multiplayer|Grinding Gear Games|Grinding Gear Games|Grinding Gear in-house engine|pc,ps5,xs|l=0.85||
No Man's Sky|2016-08-09|Adventure,Simulation|open-world,first-person,survival,sci-fi,co-op|Hello Games|Hello Games|Hello Games in-house engine|pc,ps4,xo@2018-07-24,ps5@2020-11-12,xs@2020-11-10,sw@2022-10-07,mac@2022-10-07,sw2@2025-06-05|l=0.65 dlss2|Sean Murray|65daysofstatic
Cities: Skylines II|2023-10-24|Simulation,Strategy|city-builder|Colossal Order|Paradox Interactive|Unity|pc|l=1.4||
Crusader Kings III|2020-09-01|Strategy,RPG|grand-strategy|Paradox Development Studio|Paradox Interactive|Clausewitz|pc,ps5@2022-03-29,xs@2022-03-29|l=0.3||
Sid Meier's Civilization VI|2016-10-21|Strategy|turn-based,multiplayer|Firaxis Games|2K|Firaxis in-house engine|pc,mac,sw@2018-11-16,ps4@2019-11-22,xo@2019-11-22|l=0.3||Geoff Knorr
Sid Meier's Civilization VII|2025-02-11|Strategy|turn-based,multiplayer|Firaxis Games|2K|Firaxis in-house engine|pc,mac,ps4,ps5,xo,xs,sw,sw2@2025-06-05|l=0.55||
XCOM 2|2016-02-05|Strategy|turn-based,sci-fi|Firaxis Games|2K|Unreal Engine 3|pc,ps4@2016-09-27,xo@2016-09-27,sw@2020-05-29|l=0.4|Jake Solomon|
NBA 2K25|2024-09-06|Sports|basketball,multiplayer|Visual Concepts|2K|Visual Concepts in-house engine|ps4,ps5,xo,xs,sw,pc|l=0.7 c60 nodeck||
Borderlands 4|2025-09-12|Shooter,RPG|first-person,co-op,looter-shooter|Gearbox Software|2K|Unreal Engine 5|ps5,xs,pc|l=1.4||
Borderlands 3|2019-09-13|Shooter,RPG|first-person,co-op,looter-shooter|Gearbox Software|2K|Unreal Engine 4|ps4,xo,pc,ps5@2020-11-12,xs@2020-11-10|l=0.75||
Mafia: The Old Country|2025-08-08|Action,Adventure|third-person,story-rich,linear|Hangar 13|2K|Unreal Engine 5|ps5,xs,pc|l=1.35 rt||
Control|2019-08-27|Action,Adventure|third-person,story-rich,supernatural|Remedy Entertainment|505 Games|Northlight|ps4,xo,pc,ps5@2021-02-02,xs@2021-02-02|l=0.85 rtm rt|Mikael Kasurinen|Petri Alanko & Martin Stig Andersen
Alan Wake Remastered|2021-10-05|Horror,Action|third-person,story-rich,linear|Remedy Entertainment;d3t|Epic Games|Northlight|ps4,ps5,xo,xs,pc|l=0.4||Petri Alanko
Hellblade: Senua's Sacrifice|2017-08-08|Action,Adventure|third-person,story-rich,linear|Ninja Theory|Ninja Theory|Unreal Engine 4|ps4,pc,xo@2018-04-11,sw@2019-04-11,xs@2021-07-21|l=0.5 rt|Tameem Antoniades|David García Díaz & Andy LaPlegua
Batman: Arkham Knight|2015-06-23|Action,Adventure|open-world,third-person,superhero|Rocksteady Studios|Warner Bros. Games|Unreal Engine 3|ps4,xo,pc,sw@2023-12-01|l=0.45 cc30|Sefton Hill|David Buckley & Nick Arundel
Mortal Kombat 1|2023-09-19|Fighting|multiplayer,competitive|NetherRealm Studios|Warner Bros. Games|Unreal Engine 4|ps5,xs,sw,pc|l=0.65 c60|Ed Boon|
Middle-earth: Shadow of War|2017-10-10|Action,RPG|open-world,third-person,fantasy|Monolith Productions|Warner Bros. Games|LithTech Firebird|ps4,xo,pc|l=0.55||Garry Schyman & Nathan Grigg
LEGO Star Wars: The Skywalker Saga|2022-04-05|Action,Adventure|third-person,family,co-op|TT Games|Warner Bros. Games|NTT (TT Games in-house)|ps4,ps5,xo,xs,sw,pc|l=0.6||
Kena: Bridge of Spirits|2021-09-21|Action,Adventure|third-person,family|Ember Lab|Ember Lab|Unreal Engine 4|ps4,ps5,pc,xs@2023-08-15|l=0.75 pro||Jason Gallaty
Ori and the Blind Forest|2015-03-11|Platformer|metroidvania,2d|Moon Studios|Xbox Game Studios|Unity|xo,pc,sw@2019-09-27|2d l=0.12|Thomas Mahler|Gareth Coker
The Outer Worlds|2019-10-25|RPG,Shooter|first-person,sci-fi,story-rich|Obsidian Entertainment|Private Division|Unreal Engine 4|ps4,xo,pc,sw@2020-06-05|l=0.5|Tim Cain & Leonard Boyarsky|Justin E. Bell
The Outer Worlds 2|2025-10-29|RPG,Shooter|first-person,sci-fi,story-rich|Obsidian Entertainment|Xbox Game Studios|Unreal Engine 5|ps5,xs,pc|l=1.3||
Atomic Heart|2023-02-21|Shooter,Action|first-person,sci-fi|Mundfish|Focus Entertainment|Unreal Engine 4|ps4,ps5,xo,xs,pc|l=0.8||Mick Gordon
Lords of the Fallen|2023-10-13|Action,RPG|souls-like,third-person,fantasy|Hexworks|CI Games|Unreal Engine 5|ps5,xs,pc|l=1.4||
Remnant II|2023-07-25|Shooter,RPG|third-person,co-op,souls-like|Gunfire Games|Gearbox Publishing|Unreal Engine 5|ps5,xs,pc|l=1.3||
Silent Hill 2|2024-10-08|Horror|third-person,story-rich,linear|Bloober Team|Konami|Unreal Engine 5|ps5,pc|l=1.4 rt pro|Mateusz Lenart|Akira Yamaoka
Metal Gear Solid Delta: Snake Eater|2025-08-28|Action,Adventure|third-person,stealth,story-rich|Konami|Konami|Unreal Engine 5|ps5,xs,pc|l=1.4 cc30||
Metal Gear Solid V: The Phantom Pain|2015-09-01|Action,Adventure|open-world,third-person,stealth|Kojima Productions|Konami|Fox Engine|ps4,xo,pc|l=0.35 c60|Hideo Kojima|Ludvig Forssell
Ghostwire: Tokyo|2022-03-25|Action,Adventure|open-world,first-person,supernatural|Tango Gameworks|Bethesda Softworks|Unreal Engine 4|ps5,pc,xs@2023-04-12|l=0.95 rtm rt|Kenji Kimura|Masatoshi Yanagi
Hitman: World of Assassination|2021-01-20|Action|third-person,stealth,sandbox|IO Interactive|IO Interactive|Glacier|ps4,ps5,xo,xs,pc|l=0.7 rt||Niels Bye Nielsen
Bloodborne|2015-03-24|Action,RPG|souls-like,third-person,horror|FromSoftware|Sony Interactive Entertainment|FromSoftware in-house engine|ps4|l=0.5 c30|Hidetaka Miyazaki|
Nioh 2|2020-03-13|Action,RPG|souls-like,third-person,samurai|Team Ninja|Sony Interactive Entertainment|Team Ninja in-house engine|ps4,ps5@2021-02-05,pc@2021-02-05|l=0.45||
Wo Long: Fallen Dynasty|2023-03-03|Action,RPG|souls-like,third-person|Team Ninja|Koei Tecmo|Team Ninja in-house engine|ps4,ps5,xo,xs,pc|l=0.7||
Tetris Effect: Connected|2020-11-10|Puzzle|multiplayer,rhythm|Monstars;Resonair|Enhance|Unreal Engine 4|xo,xs,pc,sw@2021-10-08,ps4@2021-10-08|l=0.15|Tetsuya Mizuguchi|
Pentiment|2022-11-15|Adventure|story-rich,2d,hand-drawn|Obsidian Entertainment|Xbox Game Studios|Unity|xo,xs,pc,ps4@2024-02-22,ps5@2024-02-22,sw@2024-02-22|2d|Josh Sawyer|Alkemie
Halo: The Master Chief Collection|2014-11-11|Shooter|first-person,co-op,multiplayer,sci-fi|343 Industries|Xbox Game Studios|—|xo,pc@2019-12-03|l=0.3||
`;

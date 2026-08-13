# Tonspur: Quelle und Loop-Bau

`ambient-original.mp3` ist die gelieferte Fassung (91 s). Sie liegt hier
statt in `public/`, damit sie nicht bei jedem Besuch mit ausgeliefert wird.

Daraus entsteht `public/audio/highway-dusk.{mp3,ogg}` – der Standard-Track
der Startseite.

## Was am Original zu tun war

1. **Ausblende abschneiden.** Ab 84 s fiel der Pegel ab (bei 88 s rund
   8 dB unter dem Rest). Beim Loopen wäre das jede Runde ein Loch.
2. **Ende über den Anfang blenden.** Die letzten 6 s der gekürzten Fassung
   verblenden mit den ersten 6 s. Beide Nahtstellen liegen dadurch
   sample-genau im Originalmaterial: Der Loop kann gar nicht knacken.
3. **Pegel auf rund -18 LUFS.** Das Original lag bei -13,6 LUFS – zu laut
   für Hintergrund. Fester Abzug statt Dynamikbearbeitung, der Track ist
   mit 1,2 LU Umfang ohnehin gleichmäßig.
4. **Zusätzlich als Opus.** MP3 trägt am Dateianfang einen Encoder-Vorlauf,
   den nicht jeder Browser wegrechnet. Bei einem Stück, das alle 78 s von
   vorn beginnt, wäre das jedes Mal ein hörbarer Stolperer. Die Seite
   nimmt Opus, wo der Browser es kann, und MP3 sonst.

## Neu bauen

```bash
cd audio-source
ffmpeg -y -i ambient-original.mp3 -ss 0  -t 6  -c:a pcm_s16le t_head.wav
ffmpeg -y -i ambient-original.mp3 -ss 6  -t 72 -c:a pcm_s16le t_mid.wav
ffmpeg -y -i ambient-original.mp3 -ss 78 -t 6  -c:a pcm_s16le t_tail.wav

# Ende über Anfang, gleiche Leistung (sonst bricht die Mitte der Blende ein)
ffmpeg -y -i t_tail.wav -i t_head.wav \
  -filter_complex "[0:a][1:a]acrossfade=d=6:c1=qsin:c2=qsin[o]" -map "[o]" \
  -c:a pcm_s16le t_blend.wav

printf "file '%s'\n" t_blend.wav t_mid.wav > liste.txt
ffmpeg -y -f concat -safe 0 -i liste.txt -c:a pcm_s16le loop.wav

ffmpeg -y -i loop.wav -af "volume=-4.5dB" -c:a libmp3lame -b:a 128k -ar 44100 \
  ../public/audio/highway-dusk.mp3
ffmpeg -y -i loop.wav -af "volume=-4.5dB" -c:a libopus -b:a 96k \
  ../public/audio/highway-dusk.ogg

rm t_*.wav loop.wav liste.txt
```

**Kein Ein- oder Ausblenden an den Dateienden** – das würde den Loop
zerstören. Die weichen Übergänge beim Ein- und Ausschalten macht die
Seite selbst.

## Ein anderes Stück einbauen

Die Schnittzeiten oben hängen am Material. Für ein neues Stück:

```bash
ffmpeg -i neu.mp3 -af ebur128=framelog=quiet -f null -   # Lautheit
for s in 60 70 80 85 88; do
  ffmpeg -ss $s -t 2 -i neu.mp3 -af volumedetect -f null - 2>&1 | grep mean_volume
done                                                     # wo endet der Pegel?
```

Dann die Zeiten anpassen: Schnitt vor der Ausblende, Blendlänge 6–8 s,
Pegelabzug = gemessene Lautheit minus (-18).

Zuletzt in `public/index.html` die Playlist ergänzen. Dort steht auch
`gain` je Stück – damit liegen alle drei auf demselben Pegel, ohne die
älteren Dateien neu encodieren zu müssen.

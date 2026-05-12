// Sons de notificacao em base64 (curtos e leves)
export const NOTIFICATION_SOUNDS = {
  coin: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQ4hj9rUrHMSKYTN0LJ8IT91xc+6fyk6d8XKuX8oOHi/xbh+KTh6usC1fSs5e7a7snsuO322trFzLD54t7avcSs6d7e3rm8qOnm4uK1uKTp7ubisbyg6e7q4rG4oOnq6t6xuKDp6u7etbyc6e7y3rm8oOnq8uK5wJzp7vbiwcCc5e728sXEnOXy+vLFwJjl9v7yxcCc5fb++sXAnOH2/vbBwJjh9v72wcCc4fb+9sHAmOH2/vbBwJjh9v72wcCY4fb+9sHAmOH2/vrBwJjh9v76wcCY4fb++sHAmOH2/vrBwJjh9v76wcCY4fb++sHAmOH2/vrBwJjh9v76wcCY4fb++sHAmN32/vbBwJjd9v72wcCY3fb+9sHAmN32/vbBwJjd9v72wcCY3fb+9sHAmN32/vbBwJjd9v72wcCY3fb+9sHAmN32/vbBwJjd9v72wcA=",
  
  success: "data:audio/wav;base64,UklGRl4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToFAACAf4B/gICAgH+AgICAgH+AgICAgICAgICAgICAgICBgYGBgYKCgoKCgoODg4ODhISEhIWFhYWGhoaGh4eHiIiIiImJiYqKiouLi4yMjI2NjY6Ojo+Pj5CQkJGRkZKSkpOTk5SUlJWVlZaWlpeXl5iYmJmZmZqampubm5ycnJ2dnZ6enp+fn6CgoKGhoaKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq6ysrK2tra6urq+vr7CwsLGxsbKysrOzs7S0tLW1tba2tre3t7i4uLm5ubq6uru7u7y8vL29vb6+vr+/v8DAwMHBwcLCwsPDw8TExMXFxcbGxsfHx8jIyMnJycrKysvLy8zMzM3Nzc7Ozs/Pz9DQ0NHR0dLS0tPT09TU1NXV1dbW1tfX19jY2NnZ2dra2tvb29zc3N3d3d7e3t/f3+Dg4OHh4eLi4uPj4+Tk5OXl5ebm5ufn5+jo6Onp6erq6uvr6+zs7O3t7e7u7u/v7/Dw8PHx8fLy8vPz8/T09PX19fb29vf39/j4+Pn5+fr6+vv7+/z8/P39/f7+/v///w==",
  
  cash: "data:audio/wav;base64,UklGRpIEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YW4EAAB/f39/gICAgH9/f4CAgIB/f3+AgICAgH9/gICAgICAf3+AgICAgIB/f4CAgICAgH9/gICAgICAf3+AgICAgIB/f4CAgICAgH9/gICAgICAf3+AgICAgH9/f4CAgICAf39/gICAgIB/f3+AgICAf39/f4CAgH9/f39/gIB/f39/f39/f39/f39/f39/f39+fn5+fn5+fn5+fn19fX19fX19fX18fHx8fHx8fHx7e3t7e3t7e3p6enp6enp5eXl5eXl5eXh4eHh4eHh3d3d3d3d3dnZ2dnZ2dnV1dXV1dXV0dHR0dHRzc3Nzc3Nzc3JycnJycnJxcXFxcXFxcHBwcHBwb29vb29vb29ubm5ubm5tbW1tbW1tbGxsbGxsa2tra2tra2pqampqamlpaWlpaWloaGhoaGhnZ2dnZ2dnZmZmZmZmZWVlZWVlZWRkZGRkY2NjY2NjY2JiYmJiYmFhYWFhYWBgYGBgYF9fX19fX15eXl5eXl1dXV1dXVxcXFxcXFtbW1tbW1paWlpaWllZWVlZWVhYWFhYWFdXV1dXV1ZWVlZWVlVVVVVVVVRUVFRUU1NTU1NTUlJSUlJSUVFRUVFRUFBQUFBQT09PT09PTk5OTk5OTU1NTU1NTExMTExMS0tLS0tLSkpKSkpKSUlJSUlJSEhISEhIR0dHR0dHRkZGRkZGRUVFRUVFRERERERDQ0NDQ0NDQkJCQkJCQUFBQUFBQEBAQEBAQEBAQEBAQEBAQEBAQEBAQA==",
};

export type SoundType = keyof typeof NOTIFICATION_SOUNDS;

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private soundType: SoundType = "coin";
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();
    }
  }

  private loadSettings() {
    try {
      const settings = localStorage.getItem("notification-sound-settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled ?? true;
        this.soundType = parsed.soundType ?? "coin";
        this.volume = parsed.volume ?? 0.5;
      }
    } catch {
      // Ignore errors
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(
        "notification-sound-settings",
        JSON.stringify({
          enabled: this.enabled,
          soundType: this.soundType,
          volume: this.volume,
        })
      );
    } catch {
      // Ignore errors
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setSoundType(type: SoundType) {
    this.soundType = type;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  getSettings() {
    return {
      enabled: this.enabled,
      soundType: this.soundType,
      volume: this.volume,
    };
  }

  async play(type?: SoundType) {
    if (!this.enabled || typeof window === "undefined") return;

    const soundToPlay = type || this.soundType;
    const soundData = NOTIFICATION_SOUNDS[soundToPlay];

    try {
      // Criar audio element
      const audio = new Audio(soundData);
      audio.volume = this.volume;
      await audio.play();
    } catch (error) {
      console.error("[NotificationSound] Erro ao tocar som:", error);
    }
  }

  // Tocar som de pagamento recebido
  async playPaymentReceived() {
    await this.play("coin");
  }

  // Tocar som de sucesso
  async playSuccess() {
    await this.play("success");
  }

  // Tocar som de dinheiro
  async playCash() {
    await this.play("cash");
  }
}

// Singleton
export const notificationSound = new NotificationSoundManager();

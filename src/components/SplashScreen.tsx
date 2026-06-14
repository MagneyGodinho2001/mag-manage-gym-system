import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '../lib/utils'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fadeOut'>('logo')

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 800)
    const timer2 = setTimeout(() => setPhase('fadeOut'), 2200)
    const timer3 = setTimeout(() => onComplete(), 2800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        phase === 'fadeOut' && 'opacity-0'
      )}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-pulse delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Logo container */}
      <div className="relative flex flex-col items-center">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'w-32 h-32 rounded-full border-2 border-primary/30 transition-all duration-1000 ease-out',
              phase !== 'logo' ? 'scale-150 opacity-0' : 'scale-100 opacity-100'
            )}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'w-32 h-32 rounded-full border border-primary/20 transition-all duration-1000 delay-200 ease-out',
              phase !== 'logo' ? 'scale-[2] opacity-0' : 'scale-100 opacity-100'
            )}
          />
        </div>

        {/* Main logo */}
        <div
          className={cn(
            'relative transition-all duration-700 ease-out',
            phase === 'logo' && 'scale-100 opacity-100',
            phase === 'text' && 'scale-90 -translate-y-4 opacity-100',
            phase === 'fadeOut' && 'scale-90 -translate-y-4 opacity-100'
          )}
        >
          <div
            className={cn(
              'w-24 h-24 rounded-3xl bg-primary flex items-center justify-center transition-all duration-500',
              'shadow-[0_0_60px_rgba(57,255,20,0.5)]'
            )}
            style={{
              animation: 'pulse-glow 2s ease-in-out infinite',
            }}
          >
            <Dumbbell
              className={cn(
                'h-12 w-12 text-primary-foreground transition-transform duration-500',
                phase === 'logo' && 'rotate-0',
                phase !== 'logo' && 'rotate-[360deg]'
              )}
            />
          </div>
        </div>

        {/* Text animation */}
        <div
          className={cn(
            'mt-8 text-center transition-all duration-700 ease-out',
            phase === 'logo' && 'opacity-0 translate-y-4',
            phase === 'text' && 'opacity-100 translate-y-0',
            phase === 'fadeOut' && 'opacity-100 translate-y-0'
          )}
        >
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="text-primary" style={{ textShadow: '0 0 30px rgba(57,255,20,0.7)' }}>
              Mag
            </span>
            <span className="text-foreground">Manage</span>
          </h1>
          <div
            className={cn(
              'mt-4 flex items-center justify-center gap-1 transition-all duration-500 delay-300',
              phase === 'text' ? 'opacity-100' : 'opacity-0'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(57, 255, 20, 0.4);
          }
          50% {
            box-shadow: 0 0 80px rgba(57, 255, 20, 0.7);
          }
        }
      `}</style>
    </div>
  )
}

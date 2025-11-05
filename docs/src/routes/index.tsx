import { createFileRoute, Link } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { baseOptions } from '@/lib/layout.shared'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className='container mx-auto px-4'>
        {/* Hero Section */}
        <div className='text-center py-20 md:py-32'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fd-muted/50 text-sm font-medium mb-6'>
            <span className='text-2xl'>⚡</span>
            <span>Simple & Powerful Rate Limiting</span>
          </div>

          <h1 className='text-4xl md:text-6xl font-bold mb-6 bg-linear-to-br from-fd-foreground to-fd-muted-foreground bg-clip-text text-transparent'>bunlimit</h1>

          <p className='text-lg md:text-xl text-fd-muted-foreground max-w-2xl mx-auto mb-8'>
            A simple and powerful rate limiting library for Bun, using Bun's native Redis client. Inspired by Upstash Ratelimit.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Link
              to='/docs/$'
              params={{ _splat: '' }}
              className='px-6 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium hover:opacity-90 transition-opacity'
            >
              Get Started
            </Link>
            <a
              href='https://github.com/lassejlv/bunlimit'
              target='_blank'
              rel='noopener noreferrer'
              className='px-6 py-3 rounded-lg border border-fd-border font-medium hover:bg-fd-muted/50 transition-colors'
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Code Example */}
        <div className='max-w-3xl mx-auto mb-20'>
          <div className='rounded-lg border border-fd-border overflow-hidden'>
            <pre className='text-sm overflow-x-auto bg-fd-secondary/50 p-6'>
              <code className='language-typescript'>
                <span className='text-fd-primary'>import</span> {'{ '}
                <span className='text-fd-foreground'>RedisClient</span>
                {' }'} <span className='text-fd-primary'>from</span> <span className='text-green-400'>'bun'</span>
                {'\n'}
                <span className='text-fd-primary'>import</span> {'{ '}
                <span className='text-fd-foreground'>Ratelimit</span>
                {', '}
                <span className='text-fd-foreground'>fixedWindow</span>
                {' }'} <span className='text-fd-primary'>from</span> <span className='text-green-400'>'bunlimit'</span>
                {'\n\n'}
                <span className='text-fd-primary'>const</span> <span className='text-blue-400'>redis</span> = <span className='text-fd-primary'>new</span>{' '}
                <span className='text-yellow-400'>RedisClient</span>(<span className='text-green-400'>'redis://localhost:6379'</span>){'\n\n'}
                <span className='text-fd-primary'>const</span> <span className='text-blue-400'>ratelimit</span> = <span className='text-fd-primary'>new</span>{' '}
                <span className='text-yellow-400'>Ratelimit</span>
                {'({\n  '}
                <span className='text-fd-foreground'>redis</span>
                {',\n  '}
                <span className='text-fd-foreground'>limiter</span>: <span className='text-yellow-400'>fixedWindow</span>(<span className='text-purple-400'>10</span>
                , <span className='text-purple-400'>60</span>), <span className='text-fd-muted-foreground'>// 10 requests per 60 seconds</span>
                {'\n})'}
                {'\n\n'}
                <span className='text-fd-primary'>const</span> {'{ '}
                <span className='text-fd-foreground'>success</span>, <span className='text-fd-foreground'>remaining</span>
                {' }'} = <span className='text-fd-primary'>await</span> <span className='text-blue-400'>ratelimit</span>.
                <span className='text-yellow-400'>limit</span>(<span className='text-green-400'>'user-123'</span>){'\n\n'}
                <span className='text-fd-primary'>if</span> (!
                <span className='text-blue-400'>success</span>) {'{\n  '}
                <span className='text-fd-primary'>throw</span> <span className='text-fd-primary'>new</span> <span className='text-yellow-400'>Error</span>(
                <span className='text-green-400'>'Rate limit exceeded'</span>){'\n}'}
              </code>
            </pre>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20'>
          <FeatureCard icon='🚀' title='Built for Bun' description="Uses Bun's native Redis client for maximum performance" />
          <FeatureCard icon='🔌' title='Flexible Adapters' description='Support for ioredis, node-redis, and custom clients' />
          <FeatureCard icon='🎯' title='Multiple Algorithms' description='Fixed Window, Sliding Window, and Token Bucket' />
          <FeatureCard icon='📊' title='Analytics' description='Optional request tracking and analytics built-in' />
          <FeatureCard icon='💪' title='Type-Safe' description='Full TypeScript support with complete type definitions' />
          <FeatureCard icon='⚡' title='Simple API' description='Intuitive and easy to use, inspired by Upstash' />
        </div>

        {/* Quick Links */}
        <div className='text-center pb-20'>
          <h2 className='text-2xl font-bold mb-8'>Ready to get started?</h2>
          <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto'>
            <QuickLink to='/docs/installation' title='Installation' description='Get up and running' />
            <QuickLink to='/docs/algorithms' title='Algorithms' description='Learn the strategies' />
            <QuickLink to='/docs/adapters' title='Adapters' description='Use any Redis client' />
            <QuickLink to='/docs/api' title='API Reference' description='Complete documentation' />
          </div>
        </div>
      </div>
    </HomeLayout>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className='p-6 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-muted/50 transition-colors'>
      <div className='text-3xl mb-3'>{icon}</div>
      <h3 className='font-semibold mb-2'>{title}</h3>
      <p className='text-sm text-fd-muted-foreground'>{description}</p>
    </div>
  )
}

function QuickLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to='/docs/$'
      params={{ _splat: to.replace('/docs/', '') }}
      className='p-4 rounded-lg border border-fd-border bg-fd-card hover:bg-fd-muted/50 transition-colors text-left'
    >
      <h3 className='font-semibold mb-1'>{title}</h3>
      <p className='text-sm text-fd-muted-foreground'>{description}</p>
    </Link>
  )
}

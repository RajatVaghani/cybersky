import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Globe, 
  Apple, 
  Monitor,
  ArrowRight,
  ExternalLink,
  Mail,
  Twitter,
  Linkedin,
  MessageCircle,
  ChevronDown
} from 'lucide-react'
import './App.css'

const products = [
  {
    name: 'Doodle Duel',
    description: "The ultimate AI-powered drawing game. Challenge friends, doodle fast, and let AI judge your artistic skills in real-time battles.",
    platforms: ['web'],
    featured: true,
    logo: '/doodleduel.png',
    links: {
      website: 'https://doodleduel.ai'
    }
  },
  {
    name: 'FlickPicker',
    description: "Find perfect movies and shows. Get personalized recommendations or create watch parties with friends.",
    platforms: ['web'],
    featured: true,
    logo: '/flickpicker.png',
    links: {
      website: 'https://theflickpicker.com'
    }
  },
  {
    name: 'Recurroo',
    description: "The smartest way to manage all your subscriptions in one place. Get powerful insights, timely reminders, and money-saving tools.",
    platforms: ['ios'],
    logo: '/recurroo.png',
    links: {
      ios: 'https://apps.apple.com/us/app/recurroo-track-subscriptions/id6743495252'
    }
  },
  {
    name: 'Snap Search',
    description: "Privacy-first browser for Android in permanent incognito mode. The first Android browser requiring zero permissions.",
    platforms: ['android'],
    logo: '/snap-search.jpg',
    links: {
      android: 'https://play.google.com/store/apps/details?id=cybersky.snapsearch',
      website: 'https://snapsearch.online'
    }
  },
  {
    name: 'Sum',
    description: "A fast-paced number game. Find the sum of numbers on a 3x3 grid before time runs out.",
    platforms: ['ios'],
    logo: '/sum.jpg',
    links: {
      ios: 'https://apps.apple.com/us/app/sum-simple-math-puzzle/id6450458099'
    }
  },
  {
    name: 'AI Diary',
    description: "Your personal AI-powered journal that talks back. Improve your writing while expressing yourself.",
    platforms: ['web'],
    logo: '/ai-diary.png',
    links: {
      website: 'https://aidiary.io'
    }
  },
  {
    name: 'Manifest AI',
    description: "Unlock your potential through personalized AI affirmations and mindful guidance.",
    platforms: ['ios'],
    logo: '/manifest-ai.jpg',
    links: {
      ios: 'https://apps.apple.com/us/app/manifest-ai-affirmations/id6739225578'
    }
  },
  {
    name: 'SnapAPI',
    description: "API management from your Mac menu bar. Simplify your API lifecycle and build better APIs faster.",
    platforms: ['mac'],
    logo: '/snapapi.jpg',
    links: {
      mac: 'https://apps.apple.com/us/app/snapapi-quick-api-menu-bar/id1668117899?mt=12'
    }
  },
]

const stats = [
  { value: 30, suffix: '+', label: 'Products' },
  { value: 18, suffix: '+', label: 'Years' },
  { value: 10, suffix: 'M+', label: 'Downloads' }
]

function AnimatedCounter({ value, suffix }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  return <span>{count}{suffix}</span>
}

function PlatformIcon({ platform, size = 16 }) {
  switch (platform) {
    case 'android':
      return <Smartphone size={size} />
    case 'ios':
      return <Apple size={size} />
    case 'web':
      return <Globe size={size} />
    case 'mac':
      return <Monitor size={size} />
    default:
      return null
  }
}

function getProductLink(product, platform) {
  // Map platform to link key (web -> website)
  const linkKey = platform === 'web' ? 'website' : platform
  return product.links[linkKey] || product.links.website || '#'
}

function ProductCard({ product, index }) {
  return (
    <motion.div
      className={`product-card ${product.featured ? 'product-card-featured' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
    >
      {product.featured && <div className="featured-badge">New</div>}
      
      <div className="product-card-inner">
        <img 
          src={product.logo} 
          alt={`${product.name} logo`}
          className="product-logo"
        />
        
        <div className="product-header">
          <h3 className="product-name">{product.name}</h3>
          <div className="platform-icons">
            {product.platforms.map(platform => (
              <span key={platform} className="platform-icon" title={platform}>
                <PlatformIcon platform={platform} />
              </span>
            ))}
          </div>
        </div>
        
        <p className="product-description">{product.description}</p>
      </div>
      
      <div className="product-links">
        {product.platforms.map(platform => {
          const href = getProductLink(product, platform)
          return (
            <a 
              key={platform} 
              href={href}
              className="product-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlatformIcon platform={platform} size={14} />
              {platform === 'web' ? 'Visit' : 'Download'}
            </a>
          )
        })}
      </div>
    </motion.div>
  )
}

function App() {
  return (
    <div className="app">
      {/* Navigation */}
      <motion.nav 
        className="nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="nav-content">
          <div className="logo">
            <img src="/cybersky-globe-white.png" alt="Cyber Sky" className="logo-img" />
            <span>Cyber Sky</span>
          </div>
          <a href="#contact" className="nav-cta">
            Contact
            <ArrowRight size={14} />
          </a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background" />
        
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.img 
            src="/cybersky-globe-white.png" 
            alt="Cyber Sky"
            className="hero-logo"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          
          <h1 className="hero-title">
            We build <span className="gradient-text">digital products</span> that people love.
          </h1>
          
          <p className="hero-subtitle">
            Over <strong>30 products</strong> built in <strong>18 years</strong> with <strong>10M+ downloads</strong>. 
            From mobile apps to web platforms, we create experiences that matter.
          </p>

          <motion.div 
            className="hero-stats"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.a 
            href="#products"
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span>View Portfolio</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown size={18} />
            </motion.div>
          </motion.a>
        </motion.div>
      </section>

      {/* Products Section */}
      <section id="products" className="products-section">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Our Portfolio</h2>
          <p>A selection of apps and platforms we've built</p>
        </motion.div>
        
        <div className="products-grid">
          {products.map((product, index) => (
            <ProductCard key={product.name} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <motion.div 
          className="contact-content"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Get in Touch</h2>
          <p>We respond within 24 hours, even on weekends.</p>
          
          <div className="social-links">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Twitter size={18} />
              <span>Twitter</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <Linkedin size={18} />
              <span>LinkedIn</span>
            </a>
            <a href="#" className="social-link">
              <MessageCircle size={18} />
              <span>Signal</span>
            </a>
            <a href="mailto:hello@cybersky.dev" className="social-link">
              <Mail size={18} />
              <span>Email</span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/cybersky-globe-white.png" alt="Cyber Sky" className="footer-logo-img" />
            <span>Cyber Sky</span>
          </div>
          <p>© {new Date().getFullYear()} Rajat Vaghani. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App

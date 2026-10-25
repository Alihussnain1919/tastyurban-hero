import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Flame, MapPin, Menu as MenuIcon, Plus, X } from 'lucide-react'
import BirdieHero from "./components/hero/BirdieHero";
import { BurgerAssemblySection, BurgerCustomizer, INITIAL_BURGER } from '@/components/burger/BurgerExperience'
import type { BurgerOptions } from '@/components/burger/BurgerExperience'

const productPhoto = {
  platform: '/images/birdie-platform-burger.png',
  birdieBurger: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/2a/05/65/burger-menu.jpg?h=-1&s=1&w=1200',
  meal: 'https://tb-static.uber.com/prod/image-proc/processed_images/75f4be23e525becf62555b6eabb3b5d6/5283d81c664b43c5f57a3a186d273063.jpeg',
}

const featured = [
  {
    number: '01',
    name: 'Platform Burger',
    tag: 'THE ORIGINAL ENERGY',
    description: 'Crispy chicken, pickles, fresh lettuce and a punch of red sauce in a soft bun.',
    image: productPhoto.platform,
    className: 'featured-card--platform',
  },
  {
    number: '02',
    name: 'Birdie Birdie Burger',
    tag: 'SIGNATURE CLASSIC',
    description: 'Golden fried chicken, melted cheese, fresh greens and our signature Birdie sauce.',
    image: productPhoto.birdieBurger,
    className: 'featured-card--classic',
  },
  {
    number: '03',
    name: 'The Birdie Meal',
    tag: 'BRING THE CREW',
    description: 'Burger, golden fries and crispy chicken for the kind of meal worth sharing.',
    image: productPhoto.meal,
    className: 'featured-card--meal',
  },
]

const ingredients = [
  { n: '01', title: 'The potato bun', note: 'Soft, warm, made to hold the crunch.' },
  { n: '02', title: 'The crispy chicken', note: 'Big crunch outside. Juicy chicken inside.' },
  { n: '03', title: 'The sauce situation', note: 'Our signature Birdie flavour, no boring bites.' },
]

function SectionIntro({ kicker, title, copy }: { kicker: string; title: string; copy: string }) {
  return (
    <div className="section-intro">
      <p className="eyebrow"><span />{kicker}</p>
      <h2>{title}</h2>
      <p className="section-copy">{copy}</p>
    </div>
  )
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [burgerOptions, setBurgerOptions] = useState<BurgerOptions>(INITIAL_BURGER)
  const [burgerQuantity, setBurgerQuantity] = useState(1)
  const reducedMotion = useReducedMotion()

  return (
    <main id="top">
     <BirdieHero />

      <div className="ticker" aria-label="Birdie Birdie highlights">
        <div className="ticker-track">
          {Array.from({ length: 2 }, (_, i) => (
            <span className="ticker-set" key={i} aria-hidden={i === 1}>
              <span>SIMPLY CRISPY CHICKEN</span><i>✳</i><span>BUILT FOR THE CRUNCH</span><i>✳</i><span>SAUCE WITH ATTITUDE</span><i>✳</i><span>BERLIN BORN</span><i>✳</i>
            </span>
          ))}
        </div>
      </div>

      <BurgerAssemblySection options={INITIAL_BURGER} />

      <section className="menu-section section-shell" id="menu">
        <motion.div
          className="menu-heading-row"
          initial={reducedMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionIntro kicker="THE LINE-UP" title={'Big flavour.\nBigger crunch.'} copy="Meet the Birdie favourites. Real chicken, bold sauces and absolutely no quiet bites." />
          <a className="round-link" href="#order" aria-label="Order from the menu"><ArrowDownRight size={22} strokeWidth={1.7} /></a>
        </motion.div>

        <div className="featured-grid">
          {featured.map((item, index) => (
            <motion.article
              className={`featured-card ${item.className}`}
              key={item.number}
              initial={reducedMotion ? false : { opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: reducedMotion ? 0 : index * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="featured-image-wrap">
                <img src={item.image} alt={item.name} loading="lazy" onError={(event) => { event.currentTarget.style.opacity = '0' }} />
                <span className="card-number">{item.number}</span>
                <span className="card-arrow"><ArrowUpRight size={20} /></span>
              </div>
              <div className="featured-info">
                <p className="card-tag">{item.tag}</p>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <a href="#order" className="text-link">Get into it <ArrowRight size={16} /></a>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="menu-bottom-row">
          <p>That’s just the start. Burgers, tenders, bites, wings, fries and dips are ready for their close-up.</p>
          <a className="button button-dark" href="#order">See the full menu <ArrowRight size={17} /></a>
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-image" role="img" aria-label="Birdie Birdie crispy chicken burger with fries and chicken pieces" />
        <div className="story-copy">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow eyebrow-light"><span />THE BIRDIE WAY</p>
            <h2>Not just crispy.<br /><em>Birdie crispy.</em></h2>
            <p className="story-lede">We believe the best bite is a little messy, always satisfying and never short on crunch.</p>
            <div className="ingredient-list">
              {ingredients.map((ingredient) => (
                <div className="ingredient-row" key={ingredient.n}>
                  <span className="ingredient-number">{ingredient.n}</span>
                  <div><h3>{ingredient.title}</h3><p>{ingredient.note}</p></div>
                  <Plus size={18} strokeWidth={1.5} />
                </div>
              ))}
            </div>
            <a className="button button-light" href="#menu">Find your favourite <ArrowRight size={17} /></a>
          </motion.div>
        </div>
      </section>

      <section className="crunch-section section-shell">
        <motion.div
          className="crunch-copy"
          initial={reducedMotion ? false : { opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <p className="eyebrow"><span />THE SOUND OF HUNGER</p>
          <h2>Hear that?<br /><em>That’s your sign.</em></h2>
          <p>From the first crackle to the last swipe of sauce, your next favourite meal is closer than you think.</p>
          <a className="button button-red" href="#order">Let’s eat <ArrowUpRight size={17} /></a>
        </motion.div>
        <motion.div
          className="crunch-stamp"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.82, rotate: -8 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 4 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ type: 'spring', stiffness: 100, damping: 16 }}
        >
          <div className="stamp-ring"><span>100% CRUNCH</span><Flame size={34} fill="currentColor" /><strong>NO<br />BORING<br />BITES</strong><span>ALL BIRDIE ENERGY</span></div>
        </motion.div>
      </section>

      <BurgerCustomizer
        options={burgerOptions}
        setOptions={setBurgerOptions}
        quantity={burgerQuantity}
        setQuantity={setBurgerQuantity}
      />

      <section className="order-section" id="order">
        <div className="order-grain" aria-hidden="true" />
        <motion.div
          className="order-inner"
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65 }}
        >
          <p className="eyebrow eyebrow-light"><span />YOU KNOW WHAT TO DO</p>
          <h2>Go on.<br /><em>Get messy.</em></h2>
          <p>Good things come to those who crunch.</p>
          <div className="order-actions">
            <a className="button button-light" href="https://www.birdiebirdie-food.com/menu" target="_blank" rel="noreferrer">Explore the menu <ArrowUpRight size={18} /></a>
            <a className="button button-outline-light" href="https://www.birdiebirdie-food.com/" target="_blank" rel="noreferrer">Order Birdie <ArrowUpRight size={18} /></a>
          </div>
        </motion.div>
        <div className="order-burger" aria-hidden="true"><img src={productPhoto.platform} alt="" /></div>
      </section>

      <section className="find-section section-shell" id="find-us">
        <div><p className="eyebrow"><span />BIRDIE IS CLOSER THAN YOU THINK</p><h2>Find your<br /><em>next bite.</em></h2></div>
        <div className="find-copy"><p>Born in Berlin, made for the crunch. Find a Birdie Birdie kitchen near you and get into the good stuff.</p><a className="button button-dark" href="https://www.birdiebirdie-food.com/" target="_blank" rel="noreferrer"><MapPin size={17} /> Find a location <ArrowUpRight size={17} /></a></div>
      </section>

      <footer className="site-footer">
        <a className="footer-logo" href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>birdie<br /><span>birdie</span><i>®</i></a>
        <p>SIMPLY CRISPY CHICKEN.</p>
        <div className="footer-links"><a href="#menu">Menu</a><a href="#story">Our crunch</a><a href="https://www.birdiebirdie-food.com/" target="_blank" rel="noreferrer">Official website <ArrowUpRight size={13} /></a></div>
        <span className="copyright">© 2026 BIRDIE BIRDIE · Ali Hussnain</span>
      </footer>

      <button className={`mobile-menu-toggle ${mobileOpen ? 'is-open' : ''}`} type="button" onClick={() => setMobileOpen((current) => !current)} aria-label={mobileOpen ? 'Close quick navigation' : 'Open quick navigation'}>
        {mobileOpen ? <X size={19} /> : <MenuIcon size={19} />}
      </button>
      {mobileOpen && (
        <nav className="mobile-quick-nav" aria-label="Quick navigation">
          <a href="#menu" onClick={() => setMobileOpen(false)}>The menu</a>
          <a href="#story" onClick={() => setMobileOpen(false)}>Our crunch</a>
          <a href="#find-us" onClick={() => setMobileOpen(false)}>Find us</a>
          <a href="#order" onClick={() => setMobileOpen(false)}>Order now</a>
        </nav>
      )}
    </main>
  )
}

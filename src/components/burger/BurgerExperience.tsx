import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Dispatch, ReactNode, SetStateAction, PointerEvent as ReactPointerEvent } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { ArrowDown, Check, RotateCcw, Sparkles } from 'lucide-react'

export type BunType = 'Brioche' | 'Sesame' | 'Potato'
export type ChickenType = 'Original crispy' | 'Extra crispy' | 'Spicy crispy'
export type SauceType = 'Signature' | 'Spicy' | 'BBQ' | 'None'

export interface BurgerOptions {
  bun: BunType
  chicken: ChickenType
  cheese: boolean
  lettuce: boolean
  pickles: boolean
  sauce: SauceType
}

export const INITIAL_BURGER: BurgerOptions = {
  bun: 'Brioche',
  chicken: 'Original crispy',
  cheese: true,
  lettuce: true,
  pickles: true,
  sauce: 'Signature',
}

interface BurgerExperienceProps {
  options: BurgerOptions
  setOptions: Dispatch<SetStateAction<BurgerOptions>>
  quantity: number
  setQuantity: Dispatch<SetStateAction<number>>
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

interface PhotoIngredientLayerProps {
  src: string
  alt: string
  className: string
  progress?: MotionValue<number>
  start: number
  end: number
  offsetY: number
  builderOffsetY?: number
  offsetX?: number
  spin?: number
  visible?: boolean
  filter?: string
  children?: ReactNode
}

/** A photoreal PNG layer that can be assembled by scroll progress. */
function PhotoIngredientLayer({
  src, alt, className, progress, start, end, offsetY, builderOffsetY = 0, offsetX = 0, spin = 0,
  visible = true, filter = 'none', children,
}: PhotoIngredientLayerProps) {
  const stationaryProgress = useMotionValue(1)
  const activeProgress = progress ?? stationaryProgress
  const x = useTransform(activeProgress, [start, end], [offsetX, 0], { clamp: true })
  // Assembly mode animates from offsetY to the landing point. Builder mode
  // uses builderOffsetY to close the stack when optional layers are removed.
  const finishY = progress ? 0 : builderOffsetY
  const y = useTransform(activeProgress, [start, end], [offsetY + finishY, finishY], { clamp: true })
  const rotate = useTransform(activeProgress, [start, end], [spin, 0], { clamp: true })
  const scale = useTransform(activeProgress, [start, end], [0.86, 1], { clamp: true })
  // Reveal each ingredient only during its own scroll beat. After its landing
  // point it remains fully opaque (including at progress === 1) and never fades
  // out at the end of the assembly timeline. In the customizer activeProgress
  // is stationary at 1, so the same layers render fully visible there too.
  const opacity = useTransform(activeProgress, (value) => {
    if (start <= 0 || value >= end) return 1
    if (value <= start) return 0

    return (value - start) / (end - start)
  })

  return <motion.div
    className={`photo-burger-layer ${className}`}
    style={{ x, y, rotate, scale, opacity: visible ? opacity : 0 }}
    aria-hidden={!visible}
  >
    <img src={src} alt={alt} draggable={false} style={{ filter }} />
    {children}
  </motion.div>
}

const sesameSeedPositions = Array.from({ length: 22 }, (_, index) => {
  const x = 20 + ((index * 37) % 61)
  const y = 27 + ((index * 23) % 47)
  return { x: `${x}%`, y: `${y}%`, rotate: `${(index * 41) % 100 - 50}deg` }
})

/**
 * Layered photographic burger. Scroll view animates each transparent PNG into
 * place; builder view uses the exact same layers so selections update instantly.
 * This is a 2.5D compositing scene, not a fully rotatable scanned 3D food model.
 */
function PhotoBurgerScene({
  options, progress, interactive = false, suppressLayer = null,
}: { options: BurgerOptions; progress?: MotionValue<number>; interactive?: boolean; suppressLayer?: string | null }) {
  const [tilt, setTilt] = useState({ x: -2, y: 0 })
  const stageRef = useRef<HTMLDivElement>(null)
  const dragOrigin = useRef<{ x: number; y: number; tiltX: number; tiltY: number } | null>(null)
  const [stageWidth, setStageWidth] = useState(0)

  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const updateWidth = () => setStageWidth(node.getBoundingClientRect().width)
    updateWidth()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Size offsets relative to the preview ensure removing an ingredient makes the
  // burger shorter instead of leaving an empty gap between the remaining layers.
  const stackUnit = Math.max(13, Math.min(42, stageWidth * 0.055))
  const afterCheese = options.cheese ? 0 : stackUnit * 0.60
  const afterLettuce = afterCheese + (options.lettuce ? 0 : stackUnit * 0.85)
  const afterPickles = afterLettuce + (options.pickles ? 0 : stackUnit * 0.48)
  const afterSauce = afterPickles + (options.sauce === 'None' ? stackUnit * 0.56 : 0)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    dragOrigin.current = { x: event.clientX, y: event.clientY, tiltX: tilt.x, tiltY: tilt.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !dragOrigin.current) return
    const deltaX = event.clientX - dragOrigin.current.x
    const deltaY = event.clientY - dragOrigin.current.y
    setTilt({
      x: Math.max(-8, Math.min(8, dragOrigin.current.tiltX - deltaY * 0.12)),
      y: Math.max(-12, Math.min(12, dragOrigin.current.tiltY + deltaX * 0.16)),
    })
  }
  const stopDragging = () => { dragOrigin.current = null }

  const bunFilter = options.bun === 'Potato'
    ? 'saturate(.78) brightness(1.04)'
    : options.bun === 'Sesame' ? 'saturate(.94) contrast(1.02)' : 'none'
  const chickenFilter = options.chicken === 'Spicy crispy'
    ? 'saturate(1.35) hue-rotate(-7deg) contrast(1.08)'
    : options.chicken === 'Extra crispy' ? 'saturate(1.12) contrast(1.15) brightness(.98)' : 'none'
  const sauceFilter = options.sauce === 'Spicy'
    ? 'saturate(1.6) hue-rotate(-10deg) contrast(1.08)'
    : options.sauce === 'BBQ' ? 'sepia(.82) saturate(.9) brightness(.65)' : 'none'

  return <div
    ref={stageRef}
    className={`photo-burger-stage ${interactive ? 'photo-burger-stage--interactive' : 'photo-burger-stage--assembly'}`}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={stopDragging}
    onPointerCancel={stopDragging}
    onLostPointerCapture={stopDragging}
    aria-label={interactive ? 'Burger ingredient preview' : 'Burger assembles as you scroll'}
  >
    <div
      className="photo-burger-model"
      style={{ transform: interactive ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : undefined }}
    >
      <PhotoIngredientLayer
        src="/images/birdie/bun-bottom.png" alt="Toasted brioche bottom bun"
        className="photo-layer--bun-bottom" progress={progress} start={0} end={0.10} offsetY={72} spin={-3} filter={bunFilter}
      />
      <PhotoIngredientLayer
        src="/images/birdie/cheddar.png" alt="Melted cheddar cheese"
        className="photo-layer--cheddar" progress={progress} start={0.10} end={0.20} offsetY={-112} spin={4} visible={options.cheese && suppressLayer !== 'photo-layer--cheddar'}
      />
      <PhotoIngredientLayer
        src="/images/birdie/lettuce.png" alt="Fresh green lettuce"
        className="photo-layer--lettuce" progress={progress} start={0.20} end={0.30} offsetY={-104} builderOffsetY={afterCheese} offsetX={-145} spin={-5} visible={options.lettuce && suppressLayer !== 'photo-layer--lettuce'}
      />
      <PhotoIngredientLayer
        src="/images/birdie/crispy-chicken.png" alt="Golden crispy chicken fillet"
        className="photo-layer--chicken" progress={progress} start={0.30} end={0.42} offsetY={-125} builderOffsetY={afterLettuce} offsetX={160} spin={5} visible={suppressLayer !== 'photo-layer--chicken'} filter={chickenFilter}
      />
      <PhotoIngredientLayer
        src="/images/birdie/signature-sauce.png" alt={`${options.sauce} sauce splash`}
        className="photo-layer--sauce" progress={progress} start={0.53} end={0.64} offsetY={-112} builderOffsetY={afterPickles} offsetX={85} spin={-5} visible={options.sauce !== 'None' && suppressLayer !== 'photo-layer--sauce'} filter={sauceFilter}
      />
      <PhotoIngredientLayer
        src="/images/birdie/pickles.png" alt="Tangy dill pickle slices"
        className="photo-layer--pickles" progress={progress} start={0.42} end={0.53} offsetY={-110} builderOffsetY={afterLettuce} offsetX={-72} spin={5} visible={options.pickles && suppressLayer !== 'photo-layer--pickles'}
      />
      <PhotoIngredientLayer
        src="/images/birdie/bun-top.png" alt="Glossy golden brioche top bun"
        className="photo-layer--bun-top" progress={progress} start={0.64} end={0.80} offsetY={-135} builderOffsetY={afterSauce} spin={-3} visible={suppressLayer !== 'photo-layer--bun-top'} filter={bunFilter}
      >
        {options.bun === 'Sesame' && <span className="photo-sesame-seeds" aria-hidden="true">
          {sesameSeedPositions.map((seed, index) => <i key={index} style={{ left: seed.x, top: seed.y, transform: `rotate(${seed.rotate})` }} />)}
        </span>}
      </PhotoIngredientLayer>
    </div>
    {interactive && <div className="photo-drag-cue" aria-hidden="true">DRAG TO TILT ↗</div>}
  </div>
}

const assemblyGradients = [
  { start: 0, end: 0.10, gradient: 'radial-gradient(ellipse at 78% 48%, rgba(255, 118, 47, .22), transparent 42%), linear-gradient(125deg, #100a13 0%, #27110d 52%, #090c16 100%)' },
  { start: 0.10, end: 0.20, gradient: 'radial-gradient(ellipse at 78% 46%, rgba(255, 179, 79, .24), transparent 42%), linear-gradient(125deg, #180b12 0%, #382015 48%, #15101c 100%)' },
  { start: 0.20, end: 0.30, gradient: 'radial-gradient(ellipse at 78% 44%, rgba(111, 184, 71, .20), transparent 42%), linear-gradient(125deg, #0c1214 0%, #252019 50%, #191024 100%)' },
  { start: 0.30, end: 0.42, gradient: 'radial-gradient(ellipse at 76% 44%, rgba(255, 112, 39, .25), transparent 44%), linear-gradient(125deg, #160b0a 0%, #3a170d 48%, #11101a 100%)' },
  { start: 0.42, end: 0.53, gradient: 'radial-gradient(ellipse at 75% 42%, rgba(173, 197, 75, .22), transparent 43%), linear-gradient(125deg, #0c1110 0%, #2c1d13 50%, #191019 100%)' },
  { start: 0.53, end: 0.64, gradient: 'radial-gradient(ellipse at 75% 42%, rgba(226, 45, 43, .26), transparent 43%), linear-gradient(125deg, #18090b 0%, #35120e 48%, #120c18 100%)' },
  { start: 0.64, end: 0.80, gradient: 'radial-gradient(ellipse at 75% 43%, rgba(255, 165, 63, .28), transparent 43%), linear-gradient(125deg, #130b0a 0%, #302014 48%, #0d0d17 100%)' },
  { start: 0.80, end: 1, gradient: 'radial-gradient(ellipse at 72% 43%, rgba(255, 178, 80, .30), transparent 46%), linear-gradient(125deg, #160c0d 0%, #382017 48%, #0d0d17 100%)' },
]

function AssemblyGradient({
  gradient, progress, start, end, initial = false, final = false,
}: { gradient: string; progress: MotionValue<number>; start: number; end: number; initial?: boolean; final?: boolean }) {
  const fadeInEnd = Math.min(end, start + 0.075)
  const fadeOutEnd = Math.min(1, end + 0.075)
  const opacity = useTransform(
    progress,
    final ? [start, fadeInEnd, end] : [start, fadeInEnd, end, fadeOutEnd],
    final ? [initial ? 1 : 0, 1, 1] : [initial ? 1 : 0, 1, 1, 0],
    { clamp: true },
  )
  return <motion.div className="assembly-gradient" style={{ background: gradient, opacity }} aria-hidden="true" />
}

const assemblyStages = [
  { title: 'Start with the good stuff.', copy: 'A soft, toasted base arrives first. Every great burger needs somewhere to start.', eyebrow: '01 / THE FOUNDATION' },
  { title: 'Let it get cheesy.', copy: 'Melted cheddar settles over the bun, with golden edges that peek out from the stack.', eyebrow: '02 / MELTED CHEDDAR' },
  { title: 'Freshness joins in.', copy: 'Crisp green lettuce fans out over the cheese, ready for the hot, golden layers.', eyebrow: '03 / FRESH LETTUCE' },
  { title: 'Bring the crunch.', copy: 'The crispy chicken lands in the middle. Golden, craggy, and made to be heard.', eyebrow: '04 / CRISPY CHICKEN' },
  { title: 'A little tang. A lot of bite.', copy: 'Pickles find their place on the chicken for that unmistakable sharp, fresh bite.', eyebrow: '05 / THE PICKLES' },
  { title: 'Sauce makes the moment.', copy: 'A glossy splash of Birdie sauce brings the finishing flavour before the bun comes down.', eyebrow: '06 / SAUCE WITH ATTITUDE' },
  { title: 'Cap it off.', copy: 'The glossy brioche top floats down and settles into place, sealing in every layer.', eyebrow: '07 / THE TOP BUN' },
  { title: 'That’s Birdie ready.', copy: 'The last layer lands. Your burger stays complete. Now make it yours in the builder below.', eyebrow: '08 / BUILT FOR THE CRUNCH' },
]

export function BurgerAssemblySection({ options }: { options: BurgerOptions }) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const [stage, setStage] = useState(0)
  const reducedMotion = useReducedMotion()

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const nextStage = value < 0.10 ? 0 : value < 0.20 ? 1 : value < 0.30 ? 2 : value < 0.42 ? 3 : value < 0.53 ? 4 : value < 0.64 ? 5 : value < 0.80 ? 6 : 7
    setStage((current) => current === nextStage ? current : nextStage)
  })

  return <section className="assembly-section" id="burger-build" ref={sectionRef} aria-label="Scroll to assemble the Birdie Birdie burger">
    <div className="assembly-sticky">
      {assemblyGradients.map((item, index) => <AssemblyGradient key={index} gradient={item.gradient} progress={scrollYProgress} start={item.start} end={item.end} initial={index === 0} final={index === assemblyGradients.length - 1} />)}
      <div className="assembly-texture" aria-hidden="true" />
      <div className="assembly-copy" aria-live="polite">
        <p className="eyebrow"><span />BIRDIE BIRDIE · THE BUILD</p>
        <p className="assembly-step">{assemblyStages[stage].eyebrow}</p>
        <motion.h2 key={`title-${stage}`} initial={reducedMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{assemblyStages[stage].title}</motion.h2>
        <motion.p key={`copy-${stage}`} className="assembly-description" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, delay: 0.04 }}>{assemblyStages[stage].copy}</motion.p>
        <div className="assembly-progress" aria-label={`Assembly step ${stage + 1} of 8`}>
          {assemblyStages.map((item, index) => <span key={item.eyebrow} className={index <= stage ? 'is-active' : ''} />)}
        </div>
        <p className="scroll-cue"><ArrowDown size={15} /> {stage === 7 ? 'Your turn — customise below' : reducedMotion ? 'Scroll to explore' : 'Keep scrolling to add the next layer'}</p>
      </div>
      <div className="assembly-canvas">
        {stage === 7 ? (
          // Final stage: show the complete burger without scroll animation.
          <PhotoBurgerScene options={options} />
        ) : (
          // Earlier stages: assemble ingredients as the user scrolls.
          <PhotoBurgerScene
            options={options}
            progress={scrollYProgress}
          />
        )}
      </div>
      <div className="assembly-side-note">REAL INGREDIENTS · REAL CRUNCH · ALL BIRDIE</div>
    </div>
  </section>
}

type FlightRect = { left: number; top: number; width: number; height: number }
type IngredientFlight = {
  id: number
  src: string
  from: FlightRect
  to: FlightRect
  layerClass: string
}

function OptionPill<T extends string>({
  label, value, selected, onSelect, image, thumbClass = '',
}: {
  label: string
  value: T
  selected: boolean
  onSelect: (value: T, source: HTMLButtonElement) => void
  image: string
  thumbClass?: string
}) {
  return <button
    type="button"
    className={`custom-option custom-option--with-thumb ${selected ? 'is-selected' : ''}`}
    onClick={(event) => { if (!selected) onSelect(value, event.currentTarget) }}
    aria-pressed={selected}
  >
    <span className={`custom-option__thumb ${thumbClass}`}><img src={image} alt="" draggable={false} /></span>
    <span className="custom-option__label">{label}</span>
    {selected && <Check size={14} strokeWidth={2.5} />}
  </button>
}

function IngredientToggle({
  title, detail, checked, onChange, image, thumbClass = '',
}: {
  title: string
  detail: string
  checked: boolean
  onChange: (value: boolean, source: HTMLButtonElement) => void
  image: string
  thumbClass?: string
}) {
  return <button
    type="button"
    className={`ingredient-toggle ${checked ? 'is-checked' : ''}`}
    onClick={(event) => onChange(!checked, event.currentTarget)}
    aria-pressed={checked}
  >
    <span className={`ingredient-toggle__thumb ${thumbClass}`}><img src={image} alt="" draggable={false} /></span>
    <span className="toggle-check">{checked ? <Check size={14} strokeWidth={2.8} /> : null}</span>
    <span className="toggle-copy"><strong>{title}</strong><small>{detail}</small></span>
    <span className={`toggle-state ${checked ? 'is-on' : ''}`}>{checked ? 'ON' : 'OFF'}</span>
  </button>
}

export function BurgerCustomizer({ options, setOptions, quantity, setQuantity }: BurgerExperienceProps) {
  const [flight, setFlight] = useState<IngredientFlight | null>(null)
  const flightId = useRef(0)

  const update = <K extends keyof BurgerOptions>(key: K, value: BurgerOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  const animateIngredient = (
    button: HTMLButtonElement,
    src: string,
    layerClass: string,
    reverse = false,
  ) => {
    const section = button.closest('.customizer-section')
    const stage = section?.querySelector('.customizer-stage')
    const target = stage?.querySelector(`.${layerClass} img`) as HTMLElement | null
    const thumb = button.querySelector('.custom-option__thumb img, .ingredient-toggle__thumb img') as HTMLElement | null

    if (!target) return

    const fromElement = reverse ? target : (thumb ?? button)
    const toElement = reverse ? (thumb ?? button) : target
    const rectToPlain = (rect: DOMRect): FlightRect => ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    })

    setFlight({
      id: ++flightId.current,
      src,
      from: rectToPlain(fromElement.getBoundingClientRect()),
      to: rectToPlain(toElement.getBoundingClientRect()),
      layerClass,
    })
  }

  const choose = <K extends keyof BurgerOptions>(
    key: K,
    value: BurgerOptions[K],
    button: HTMLButtonElement,
    src: string,
    layerClass: string,
    reverse = false,
  ) => {
    if (options[key] === value) return
    animateIngredient(button, src, layerClass, reverse)
    update(key, value)
  }

  const toggleIngredient = (
    key: 'cheese' | 'lettuce' | 'pickles',
    value: boolean,
    button: HTMLButtonElement,
    src: string,
    layerClass: string,
  ) => {
    animateIngredient(button, src, layerClass, !value)
    update(key, value)
  }

  const reset = () => {
    setFlight(null)
    setOptions(INITIAL_BURGER)
    setQuantity(1)
  }
  const ingredientSummary = [options.cheese && 'Cheddar', options.lettuce && 'Lettuce', options.pickles && 'Pickles', options.sauce !== 'None' && `${options.sauce} sauce`].filter(Boolean).join(' · ')

  return <>
    <section className="customizer-section" id="customizer">
      <div className="customizer-heading">
        <div>
          <p className="eyebrow"><span />YOUR TURN AT THE GRILL</p>
          <h2>Make it <em>your Birdie.</em></h2>
          <p className="customizer-lede">Pick your layers. The photoreal burger updates as you go. Drag to tilt the ingredient stack and inspect your build.</p>
        </div>
        <button type="button" className="reset-builder" onClick={reset}><RotateCcw size={15} /> Reset build</button>
      </div>

      <div className="customizer-grid">
        <div className="customizer-stage">
          <div className="stage-topline"><span><span className="live-dot" /> LIVE INGREDIENT PREVIEW</span><span>DRAG TO TILT ↗</span></div>
          <div className="customizer-canvas-wrap">
            <PhotoBurgerScene
              options={options}
              interactive
            />          <div className="stage-shadow" aria-hidden="true" />
          </div>
          <div className="stage-caption"><Sparkles size={15} /><span>Every layer updates instantly</span><span className="ingredient-count">{3 + Number(options.cheese) + Number(options.lettuce) + Number(options.pickles) + Number(options.sauce !== 'None')} layers active</span></div>
        </div>

        <div className="builder-controls">
          <div className="builder-section-title"><span>01</span><div><h3>Choose your bun</h3><p>The first impression.</p></div></div>
          <div className="option-row">
            <OptionPill label="Brioche" value="Brioche" image="/images/birdie/bun-top.png" selected={options.bun === 'Brioche'} onSelect={(value, source) => choose('bun', value, source, '/images/birdie/bun-top.png', 'photo-layer--bun-top')} />
            <OptionPill label="Sesame" value="Sesame" image="/images/birdie/bun-top.png" thumbClass="option-thumb--sesame" selected={options.bun === 'Sesame'} onSelect={(value, source) => choose('bun', value, source, '/images/birdie/bun-top.png', 'photo-layer--bun-top')} />
            <OptionPill label="Potato" value="Potato" image="/images/birdie/bun-top.png" thumbClass="option-thumb--potato" selected={options.bun === 'Potato'} onSelect={(value, source) => choose('bun', value, source, '/images/birdie/bun-top.png', 'photo-layer--bun-top')} />
          </div>
          <div className="builder-divider" />

          <div className="builder-section-title"><span>02</span><div><h3>Pick your crunch</h3><p>Choose your chicken style.</p></div></div>
          <div className="option-column">
            <OptionPill label="Original crispy" value="Original crispy" image="/images/birdie/crispy-chicken.png" selected={options.chicken === 'Original crispy'} onSelect={(value, source) => choose('chicken', value, source, '/images/birdie/crispy-chicken.png', 'photo-layer--chicken')} />
            <OptionPill label="Extra crispy" value="Extra crispy" image="/images/birdie/crispy-chicken.png" thumbClass="option-thumb--extra-crispy" selected={options.chicken === 'Extra crispy'} onSelect={(value, source) => choose('chicken', value, source, '/images/birdie/crispy-chicken.png', 'photo-layer--chicken')} />
            <OptionPill label="Spicy crispy" value="Spicy crispy" image="/images/birdie/crispy-chicken.png" thumbClass="option-thumb--spicy" selected={options.chicken === 'Spicy crispy'} onSelect={(value, source) => choose('chicken', value, source, '/images/birdie/crispy-chicken.png', 'photo-layer--chicken')} />
          </div>
          <div className="builder-divider" />

          <div className="builder-section-title"><span>03</span><div><h3>Stack your toppings</h3><p>Keep it classic or change the whole vibe.</p></div></div>
          <div className="ingredient-toggles">
            <IngredientToggle title="Cheddar cheese" detail="Melted, golden and gooey" image="/images/birdie/cheddar.png" checked={options.cheese} onChange={(value, source) => toggleIngredient('cheese', value, source, '/images/birdie/cheddar.png', 'photo-layer--cheddar')} />
            <IngredientToggle title="Fresh lettuce" detail="A little freshness in the crunch" image="/images/birdie/lettuce.png" checked={options.lettuce} onChange={(value, source) => toggleIngredient('lettuce', value, source, '/images/birdie/lettuce.png', 'photo-layer--lettuce')} />
            <IngredientToggle title="Pickles" detail="Tangy, bright, bite-sized" image="/images/birdie/pickles.png" checked={options.pickles} onChange={(value, source) => toggleIngredient('pickles', value, source, '/images/birdie/pickles.png', 'photo-layer--pickles')} />
          </div>
          <div className="builder-divider" />

          <div className="builder-section-title"><span>04</span><div><h3>Bring on the sauce</h3><p>Choose your signature finish.</p></div></div>
          <div className="option-row sauce-options">
            <OptionPill label="Signature" value="Signature" image="/images/birdie/signature-sauce.png" selected={options.sauce === 'Signature'} onSelect={(value, source) => choose('sauce', value, source, '/images/birdie/signature-sauce.png', 'photo-layer--sauce')} />
            <OptionPill label="Spicy" value="Spicy" image="/images/birdie/signature-sauce.png" thumbClass="option-thumb--spicy-sauce" selected={options.sauce === 'Spicy'} onSelect={(value, source) => choose('sauce', value, source, '/images/birdie/signature-sauce.png', 'photo-layer--sauce')} />
            <OptionPill label="BBQ" value="BBQ" image="/images/birdie/signature-sauce.png" thumbClass="option-thumb--bbq" selected={options.sauce === 'BBQ'} onSelect={(value, source) => choose('sauce', value, source, '/images/birdie/signature-sauce.png', 'photo-layer--sauce')} />
            <OptionPill label="No sauce" value="None" image="/images/birdie/signature-sauce.png" thumbClass="option-thumb--none" selected={options.sauce === 'None'} onSelect={(value, source) => choose('sauce', value, source, '/images/birdie/signature-sauce.png', 'photo-layer--sauce', true)} />
          </div>

          <div className="builder-summary">
            <div className="summary-copy"><span className="summary-kicker">YOUR BUILD</span><strong>{options.bun} · {options.chicken}</strong><small>{ingredientSummary || 'No extra toppings selected'}</small></div>
            <div className="quantity-picker" aria-label="Quantity selector"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity((current) => Math.min(10, current + 1))} disabled={quantity >= 10} aria-label="Increase quantity">+</button></div>
          </div>
          <a className="button button-red builder-order" href="https://www.birdiebirdie-food.com/menu" target="_blank" rel="noreferrer">Find it on the menu <span aria-hidden="true">↗</span></a>
          <p className="builder-disclaimer">This is an interactive concept configurator. Final ingredients, availability and prices depend on the restaurant's current menu.</p>
        </div>
      </div>
    </section>
    {flight && createPortal(
      <motion.img
        key={flight.id}
        className="ingredient-flight"
        src={flight.src}
        alt=""
        aria-hidden="true"
        draggable={false}
        initial={{
          left: flight.from.left,
          top: flight.from.top,
          width: flight.from.width,
          height: flight.from.height,
          opacity: 0.98,
          scale: 0.82,
          rotate: -8,
        }}
        animate={{
          left: flight.to.left,
          top: flight.to.top,
          width: flight.to.width,
          height: flight.to.height,
          opacity: [0.98, 1, 0],
          scale: [0.82, 1.06, 0.88],
          rotate: [-8, 3, 0],
        }}
       transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setFlight((current) => current?.id === flight.id ? null : current)}
        style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none', objectFit: 'contain' }}
      />,
      document.body,
    )}
  </>
}

export function BurgerExperience(props: BurgerExperienceProps) {
  return <>
    <BurgerAssemblySection options={props.options} />
    <BurgerCustomizer {...props} />
  </>
}

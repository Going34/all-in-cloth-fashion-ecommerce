'use client';

import React from 'react';
import { Leaf, Recycle, Heart, Users, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[70vh] sm:h-[85vh] overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000" 
          alt="Sustainable Fashion" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl text-white space-y-6 animate-in fade-in slide-in-from-bottom duration-1000">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif leading-[1]">Sustainability & Ethics</h1>
            <p className="text-lg sm:text-xl font-light tracking-wide max-w-2xl mx-auto">
              Crafting the future of fashion through responsible practices, ethical sourcing, and environmental stewardship.
            </p>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Our Promise</span>
              <h2 className="text-4xl sm:text-5xl font-serif leading-[1]">A Commitment to <br/>Conscious Creation</h2>
            </div>
            <p className="text-neutral-600 leading-relaxed text-lg">
              At All in Cloth, sustainability isn&apos;t an afterthought—it&apos;s woven into every thread of our operation. 
              We believe that true luxury lies in garments that honor both the planet and the people who create them.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Our journey toward a more sustainable future is ongoing, transparent, and built on measurable impact. 
              We&apos;re committed to reducing our environmental footprint while maintaining the exceptional quality and 
              design integrity our community expects.
            </p>
          </div>
          <div className="relative aspect-[4/5]">
            <img 
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800" 
              alt="Sustainable materials" 
              className="w-full h-full object-cover shadow-2xl rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Key Pillars */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Our Approach</span>
            <h2 className="text-4xl sm:text-5xl font-serif">Three Pillars of Impact</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="p-4 bg-neutral-50 rounded-xl w-fit mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Leaf size={32} />
              </div>
              <h3 className="text-xl font-serif mb-4">Sustainable Materials</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                85% of our fabrics are sustainably sourced, organic, or recycled. We prioritize natural fibers 
                and innovative eco-friendly alternatives.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="p-4 bg-neutral-50 rounded-xl w-fit mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-serif mb-4">Ethical Production</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                We partner exclusively with certified fair-trade facilities that provide safe working conditions 
                and fair wages to all artisans.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow group">
              <div className="p-4 bg-neutral-50 rounded-xl w-fit mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-serif mb-4">Community Impact</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                We invest in local communities through education programs and support initiatives that empower 
                the next generation of makers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="text-5xl sm:text-6xl font-serif text-neutral-900">85%</div>
            <p className="text-neutral-600 text-sm uppercase tracking-widest font-bold">Sustainable Materials</p>
            <p className="text-neutral-500 text-sm">of our collection uses eco-friendly fabrics</p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl sm:text-6xl font-serif text-neutral-900">50%</div>
            <p className="text-neutral-600 text-sm uppercase tracking-widest font-bold">Carbon Reduction</p>
            <p className="text-neutral-500 text-sm">reduction in emissions by 2025</p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl sm:text-6xl font-serif text-neutral-900">100%</div>
            <p className="text-neutral-600 text-sm uppercase tracking-widest font-bold">Fair Trade</p>
            <p className="text-neutral-500 text-sm">of our production partners are certified</p>
          </div>
        </div>
      </section>

      {/* Materials & Sourcing */}
      <section className="bg-neutral-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5]">
              <img 
                src="https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?q=80&w=800" 
                alt="Organic cotton" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Materials</span>
                <h2 className="text-4xl sm:text-5xl font-serif leading-[1]">Sourcing with <br/>Consciousness</h2>
              </div>
              <p className="text-neutral-300 leading-relaxed text-lg">
                We meticulously select materials that meet our strict environmental and ethical standards. 
                From organic cotton to recycled polyester, every fiber tells a story of responsible sourcing.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle2 size={24} className="text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Organic & Regenerative Fibers</h4>
                    <p className="text-neutral-400 text-sm">GOTS-certified organic cotton, linen, and hemp from regenerative farms</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle2 size={24} className="text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Recycled Materials</h4>
                    <p className="text-neutral-400 text-sm">Post-consumer recycled polyester and nylon from ocean waste</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle2 size={24} className="text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Innovative Alternatives</h4>
                    <p className="text-neutral-400 text-sm">Tencel, modal, and other sustainable cellulosic fibers</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle2 size={24} className="text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Traceable Supply Chain</h4>
                    <p className="text-neutral-400 text-sm">Full transparency from farm to finished garment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Goals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Looking Forward</span>
          <h2 className="text-4xl sm:text-5xl font-serif">Our 2025 Goals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="border border-neutral-200 rounded-2xl p-8 hover:border-neutral-900 transition-colors">
            <Award className="mb-6 text-neutral-900" size={32} />
            <h3 className="text-xl font-serif mb-4">Carbon Neutral</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Achieve carbon neutrality across our entire supply chain through renewable energy and offset programs.
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-8 hover:border-neutral-900 transition-colors">
            <Recycle className="mb-6 text-neutral-900" size={32} />
            <h3 className="text-xl font-serif mb-4">Zero Waste</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Eliminate production waste through circular design principles and comprehensive recycling programs.
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-8 hover:border-neutral-900 transition-colors">
            <Users className="mb-6 text-neutral-900" size={32} />
            <h3 className="text-xl font-serif mb-4">100% Transparency</h3>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Provide complete supply chain visibility with detailed impact reporting for every product.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-neutral-50 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-serif">Join Us on This Journey</h2>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl mx-auto">
            Sustainability is a collective effort. Together, we can build a fashion industry that respects 
            both people and planet. Explore our consciously crafted collections and be part of the change.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/shop" 
              className="bg-neutral-900 text-white px-10 py-4 font-medium hover:bg-neutral-800 transition-all flex items-center space-x-2"
            >
              <span>Shop Sustainable Collection</span>
              <ArrowRight size={18} />
            </Link>
            <Link 
              href="/contact" 
              className="border border-neutral-900 text-neutral-900 px-10 py-4 font-medium hover:bg-neutral-900 hover:text-white transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


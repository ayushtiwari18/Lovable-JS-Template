import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Palette, Heart } from "lucide-react";

export const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-orange-50 to-yellow-50 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Create
              <span className="text-primary"> Beautiful </span>
              Custom Trophies & Gifts
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              From personalized trophies to custom photo frames, we help you
              celebrate life's special moments with unique, handcrafted items
              that tell your story.
            </p>

            {/* Features */}
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-700">Premium Quality</span>
              </div>
              <div className="flex items-center">
                <Palette className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-700">Full Customization</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-primary mr-2" />
                <span className="text-gray-700">Made with Love</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="animate-fade-in">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-yellow-200/30 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                      <img
                        src="/mandir/Ram-mandir.png"
                        class="shadow-lg rounded-lg w-64 h-auto"
                      ></img>
                      {/* <Award /> */}
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                      <img
                        src="/trophy/trophy-1.png"
                        class="shadow-lg rounded-lg w-64 h-auto"
                      ></img>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                      <img
                        src="/trophy/trophy-2.png"
                        class="shadow-lg rounded-lg w-64 h-auto"
                      ></img>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 aspect-square flex items-center justify-center">
                      <img
                        src="/org-customization/org-1.png"
                        class="shadow-lg rounded-lg w-64 h-auto"
                      ></img>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-primary text-white rounded-full p-3 shadow-lg">
                <Palette className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-yellow-500 text-white rounded-full p-3 shadow-lg">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

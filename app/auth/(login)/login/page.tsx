"use client";
// import Image from "next/image";
// import background from "@/public/images/auth/line.png";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Fragment, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import LogInForm from "@/components/auth/login-form";

const LoginPage = () => {
  const [openVideo, setOpenVideo] = useState<boolean>(false);
  return (
    <Fragment>
      <div className="min-h-screen bg-background flex items-center overflow-hidden w-full">
        <div className="min-h-screen flex flex-wrap w-full justify-center overflow-y-auto">
          <div
            className="basis-1/2 w-full relative hidden xl:flex justify-center items-center bg-gradient-to-br
            from-primary-600 via-primary-400 to-primary-600"
          >
            {/* <Image
              src={background}
              alt="image"
              className="absolute top-0 left-0 w-full h-full "
            /> */}
            <div className="relative z-10 backdrop-blur bg-primary-foreground/40 py-14 px-16 2xl:py-20 2xl:px-24 rounded-lg max-w-[640px] shadow-xl">
              <div>
                <Button
                  className="bg-white hover:bg-white/90 text-primary font-medium rounded-full py-2 px-6 shadow-md mb-8"
                  onClick={() => setOpenVideo(true)}
                >
                  Assistir vídeo
                </Button>

                <div className="text-4xl leading-[50px] 2xl:text-6xl 2xl:leading-[72px] font-semibold mt-2.5">
                  <span className="text-white dark:text-default-300">
                    Otimize sua <br />
                    Precificação <br />
                  </span>
                  <span className="text-white dark:text-default-50 underline decoration-4 decoration-white/30">
                    sem complicações
                  </span>
                </div>
                <div className="mt-5 2xl:mt-8 text-white/90 dark:text-default-200 text-xl font-medium">
                  A plataforma que automatiza seus cálculos <br />
                  e maximiza seus lucros no WooCommerce.
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-screen basis-full md:basis-1/2 w-full px-4 py-5 flex justify-center items-center">
            <div className="w-full max-w-[480px] p-6 md:p-8">
              <LogInForm />
            </div>
          </div>
        </div>
      </div>
      <Dialog open={openVideo} onOpenChange={setOpenVideo}>
        <DialogContent className="p-0 max-w-4xl">
          <DialogTitle className="sr-only">Vídeo de demonstração</DialogTitle>
          <Button
            size="icon"
            onClick={() => setOpenVideo(false)}
            className="absolute -top-4 -right-4 bg-default-900 hover:bg-default-800 z-10"
          >
            <X className="w-5 h-5" />
          </Button>
          <iframe
            width="100%"
            height="500"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Vídeo de demonstração"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-md"
          ></iframe>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default LoginPage;

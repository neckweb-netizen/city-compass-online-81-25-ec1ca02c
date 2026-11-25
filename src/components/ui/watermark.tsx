import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

interface WatermarkProps {
  variant?: 'footer' | 'sidebar';
  className?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ 
  variant = 'footer', 
  className 
}) => {
  const location = useLocation();
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        "text-xs text-muted-foreground text-center border-t pt-2",
        className
      )}>
        <span className="font-medium">Made By Deivid</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full py-6 border-t bg-muted/20",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <span className="inline-flex min-h-12 items-center justify-center gap-1.5" aria-label="Desenvolvido por Deivid">
              <span className="bg-gradient-to-b from-fuchsia-300 via-purple-500 to-violet-900 bg-clip-text text-3xl font-black italic tracking-tight text-transparent drop-shadow-sm sm:text-4xl">
                Deivid
              </span>
              <video
                aria-label="Coroa dourada original girando"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-contain"
                src="data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAwMEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggEwTbuMU6uEHFO7a1Osggv27AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjEuNy4xMDNXQYxMYXZmNjEuNy4xMDNEiYhAksAAAAAAABZUrmvVrgEAAAAAAABM14EBc8WIpjNvlA5oErCcgQAitZyDZW5nhoVWX1ZQOIOBASPjg4QL68IA4KCwgSC6gSCagQJTwIEBVbCQVbqBAVWxgQVVu4EBVbmBARJUw2dBRXNz9GPAgGfIm0WjkUNPTVBBVElCTEVfQlJBTkRTRIeEcXQgIGfIlUWji01BSk9SX0JSQU5ERIeEcXQgIGfInEWjjU1JTk9SX1ZFUlNJT05Eh4k1MzcxOTkzNjBnyJlFo4dFTkNPREVSRIeMTGF2ZjYxLjcuMTAzc3NAymPAi2PFiKYzb5QOaBKwZ8iRRaOKQUxQSEFfTU9ERUSHgTFnyKtFo4xIQU5ETEVSX05BTUVEh5lBcHBsZSBWaWRlbyBNZWRpYSBIYW5kbGVyZ8iTRaOJVkVORE9SX0lERIeEYXBwbGfImUWjiFRJTUVDT0RFRIeLMDA6MDA6MDI6MDBnyKFFo4dFTkNPREVSRIeUTGF2YzYxLjE5LjEwMSBsaWJ2cHhnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAxLjIwMDAwMDAwMAAfQ7Z1SXXngQCjQviBAACAEBQAnQEqIAAgAABHCIWFiJmEiAICizP8QGoF9c+YR/Mv7MLcB/gP4OXhmaIIReOx5gL0WfPPx2/le8V/2b8q+AD+pP9m/gPCA/pF1gPoA/rt6Tv7GfAh+w37XfAD+tNyB5DX1JyQnz38MM+j+In5GZaX+SuoxflBrwP8B9oHv2fuH3JexH2v9wH+Mf0L/S/l93IPQB/Un20HzMNudC2K3vXoWrPJlHNs/4D+/5iX//2PH/2XOW/6CP/uerlJ9u7BkIHOv2fn/9onk/xB4f4ue6tiDo5jDP//+cwJX5P5/zsf9Bfb/7qBrv//X2ux8QH/0PP4WNFcf7zq///A+4VfNDL+vNqbPhfrTEjR/kvB9irGhTrMZOJQgrnKgF9c/5tQDI/DT4c9C1/hrQ7vWkV7qPY3yOldr979fCzbQNfWIf/7zZAc+kOiSltO9aClWMPIhuOTpKtS8wfKsSTjQc+iS9bs2IRrrvl768FFPcAglSo2/MO3ApB4DXGehEX64PssfhMqLf/htd1ClCl/C97zBYIK7S3wRym2ePIjUTTOR0j/fv8LZNavg4gtl0gVA/X2r9/+y786n9rvZZtnBG4bJryjWa4ZMRk+yaklC4c1NCV09vufZT3NtpBK/rgn863lwdlzB21Y/pjN7EudKZ/MLmwNQwue8fXnc1W53lt7anR4eClA95mYigjFgbBYOYTB+lsPGXfm//o+EjH0Gtho3cx2wSZqPq4zyya1Vb9fdV0i3APVIw+iTJv6DTfbU8ArnqrRXKOZXk2hDP4NrFX/8zetQzon/NwEIoG7V3K96ulWmcO5EbZZnqeTn2CRMMVGaHJ188/rXm7C/ATIDuy/cx2H8/+JPmMp2l+ibVdFjVUBBMB5BmgPeH4AO3IHv0Mi9pm5J/c5slygaB/FHsn98KL/9dWLlyN/to9QZ/PkBEPM6Re24kM6PHMNJ6q865b2ZL//2gQ2kgC4N2xTcAb6qkV8BMhPwPh1ZPAJb9Nrn0gAo0IXgQDIAPEKABEQMAAbcl/lf4zegbrX/J/xd/oGeTxX5hv9D0xrAH1Ov1b5gl7b+7+dx5AeZt/jf+b7Av5R+3fYV+gCNYm/vX5gKgdsDXHNwCIa9hd6CKZBLpaNsDwUgP7PQf9c/+t07/+UJyo7vr9H91n//Zj3eX9OtRrp2r6GZmzFeDYUvf3SObhWrcz56hen5UJRii7/awd+gAD8bnHN3rrPeOR/Pl/5A1ZF9MYii+GrIMf1UBrGIIafARDzfqsZL//kV939th/+DX/2FMKrdVo17nF1uTJmdhNzJxOXGIfTruRLlv/2bLGjhDYkcCiiIPZZRbudhXRAdANqeFD0Jpud96tt5zroJ/a9518d80mM7MvYx/5573Thz5RvpGb2cb0rrW37K2vRZgILC5Dz4UcN4D+IFo/sR7vRjycO3Vj8DV4xME6pys4IA/XhAlvFmqH3LJ6dRx11AO+0QuLtcpBiy4s56FQbs3f6sm/+npns6zXTgtHeMrr2Fd/Gzih+9b4wi1gCWGkGRcmWJe4aXOI5PjFaCTeP5d8WIcBNDy4L++9CfKn7QimnzX/1SO77Nq6n/r9vun/qncTu3Vyi/Iovs7i/DxcCwPZxOxbdr8z73eAM5dMRIcE4s6DQqZ+HssdtBmhMJEbaAiN7MfjGRwF8LNuPKzezLjZ9/jyuaP/9xdnxc8ldgVncY7rD6shCd3GWeAsAAKNBVoEBkABxAwAVEFAAG9KlQgpzHJVCRt21/vEqVx28D6Mg0aD+yvJ/j/0cyf+nP25wijdPju4/jUAfXGYZ+7neH84VHvcIvymwzanMVfJClmLc+x3RgNl9H+xNXE0SZgFLW0+h28aX+Xz/+q1xLjb/+i34q/07PeVf/9mSVrAGYyL1abX5i2L03PRn/11vrbFs7bK2XvLH/DWYZBnsVmsS2COqsXvyIOaRjzN5QWvJPJ5kf8I4bT2fnigYP8Pr+Eq3xeFp/3kxnHKn2dPrF2KdzmtaQvDf3d5U35bD89ZW/pXw7VbHOUyrD6KkBZABzZh/lTld26KJAW+HLzMavo82kkmq6Wu7v7U9TmAj9JY8kiWKyk9UhmHgu877KzlRopT//R94QUIQWLS16mjiV3uQ5NiocOMQBugamZBAAFpC9ODp698QCAcBO5naZ0cTQWL1c8QiCU+gAKNBB4ECWADxAQAfEGgAGAAwKBgv6H4yQhDkP2r/5jcmiuxQ/jR+Vl+Cn5pIvPDNoInoXuNGSep37+2YfwxRFEP9OiaUu7KGggksM+Z/1f9R9riSa3oljn9/853Bv/+2MvSyQXAp9bMDQNl+SBoxHjTfBlMLzwTiP22mfv7dT0WS87e2e0Fe4q4+fAbwgCTOU/1A+AQJk2GyHNaHpzzzl49d9J8r+pePootOCaHCf5Dt+O0YYyBeHSabov/4+2qjHG7V74vdsHIAFhNO//c1I5/Reqb3pX442ImkC4B5Zm2Fyp6rqbVnI9H7UhI31l9NFJDleAwjX9fIvPdmADBTj6Eag49DJwItSAAAo0D1gQMgABEDACMQeAAZWf99YFisfAPiAgV9QsV9XmgmEP3/bD6mqXxX95oZ/0vTACAm6CSPRYR3O9WLvpm3Z0/KqR+PoHUtynZm04K4UrVRdHtg3FSdhLbqXvxG//7Xn/kj5z1yaGFPBfVi8wWK0xKkG6RgEFb5t+Rizzh94eMUk1U7WvvQlwE3ir/CRo5JapHxgxun5yQvV1266Jb7H5R9JdfT34BzluC5+zuH6lgzlwqwnLou3mkehe+6ptlsQ+hheXRZYm91b1KvonlY1GvjvV6pT9WN6UAcejBETeXwgtR5ZQgYAZu0G3tIvksA6WG4wqHJQACjQP+BA+gAcQMAGhCEABl4z/QGekhXf4GBQR//Tatd7PWY09wA/rpV/QNy8nmdyyVegm8C4UmJs4l///OP8pLeBgs1WylfTqip7uCk45xeQhhUpqzrzBZs51/s/i3uN6KPeVf/kH0f4wK1ZPJikxvKCQqcOCkX3sltyGV6RYTdSRCjgg0YeKYCCfmFwrrEm3iWYk/Jxrye0d0YrNU30WvbZRbuTta+bu35cP69zCL32QAAIFhDyANZAywUiFJ4EbMxL28H6/OJ0cQYeVE8mCiYv/CAMM1xdbgMm9udiE4X5ysdDgqQYSQnAAWIAQTCudJP9eCwD98n+YfwxDZVNMCgAAAcU7trkbuPs4EAt4r3gQHxggJ78IED"
              />
            </span>
          </div>

          <nav aria-label="Informações e ajuda" className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-xs text-muted-foreground">
            {location.pathname === '/' && (
              <>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('sajtem:start-visitor-tour'))}
                  className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Como usar o Saj Tem
                </button>
                <span aria-hidden="true" className="text-border">•</span>
              </>
            )}
            <Link
              to="/politica-de-privacidade"
              className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Política de Privacidade
            </Link>
            <span aria-hidden="true" className="text-border">•</span>
            <Link
              to="/termos-de-uso"
              className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Termos de Uso
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

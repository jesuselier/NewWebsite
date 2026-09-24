import Image from "next/image";
import { ContactStrip } from "@/components/SiteSections";
import { LINKS, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata(
  "My Story",
  "From $700 in Axie Infinity to building JM Crypto. Jesus Martinez shares the family story that brought him into crypto.",
  "/about",
);
export default function AboutPage() {
  return (
    <>
      <div className="container page-body">
        <header className="page-heading">
          <span className="section-label">My story</span>
          <h1>It started with family.</h1>
          <p>
            Before the channel, before the interviews, there was a brother I
            wanted to help.
          </p>
        </header>
        <div className="about-layout">
          <figure className="about-photo">
            <Image
              src="/media/jesus-martinez-portrait.jpg"
              alt="Jesus Martinez in his studio beside the JM Crypto microphone"
              fill
              sizes="(max-width: 760px) 92vw, 43vw"
              preload
            />
          </figure>
          <div className="about-copy">
            <h2>From Little Havana to JM Crypto.</h2>
            <p>
              I’m a first-generation Cuban American, born and raised in Miami.
              My parents left Cuba and started over so we could have a different
              future. I grew up knowing their sacrifice meant something.
            </p>
            <p>
              For a long time, I didn’t know what I wanted to do with that
              opportunity. I worked jobs in retail and hospitality, studied
              computer science, and spent most of my free time playing games.
              During the pandemic, I went from Platinum to Challenger in League
              of Legends. It taught me how deeply I could learn something when I
              cared enough.
            </p>
            <h2>Then my brother lost everything.</h2>
            <p>
              In 2021, my brother lost his life savings through high-leverage
              crypto trading. We had always bonded over video games, and he had
              helped me through a lot. Now I wanted to show up for him.
            </p>
            <p>
              I changed my major from computer science to economics and started
              looking for a way to help. That search led me to Axie Infinity.
            </p>
            <h2>$700 changed my direction.</h2>
            <p>
              I spent $700, half of my bank account at the time, on three Axies
              for my brother’s birthday. As I learned the game’s breeding
              market, I turned that starting amount into mid-five figures.
            </p>
            <p>
              I had promised to make him whole and give him half the proceeds.
              Being able to do that changed how I saw my future. I wanted to
              understand this industry, then share what I was learning.
            </p>
            <h2>Today, I’m all in on JM Crypto.</h2>
            <p>
              I’ve been working full time in crypto since 2021. The channel has
              evolved with me, from gaming economies to the wider market,
              Bittensor, and AI. The through line is curiosity: find something
              worth understanding, put in the work, and make it useful to
              someone else.
            </p>
            <p>
              Right now, my focus is growing JM Crypto through deeper research,
              honest conversations, and showing up for the people watching.
            </p>
            <a
              className="text-link"
              href={LINKS.crypto}
              target="_blank"
              rel="noopener noreferrer"
            >
              Come follow the journey <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
      <ContactStrip />
    </>
  );
}

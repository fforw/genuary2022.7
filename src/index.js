import domready from "domready"
import "./style.css"
import { voronoi } from "d3-voronoi";
import { polygonCentroid } from "d3-polygon";
import concaveman from "concaveman";
import getRandomPalette from "./getRandomPalette";
import Color, { getLuminance } from "./Color";


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


function getRandomPoints(num)
{
    const { width, height } = config

    let pts = []
    for (let i = 0; i < num; i++)
    {
        pts.push([
            0|Math.random() * width,
            0|Math.random() * height
        ])

    }

    const start = pts.slice()

    const v = voronoi().extent([[0, 0], [width, height]])

    const relaxCount = 5 + Math.random() * 5;

    for (let i=0; i < relaxCount; i++)
    {
        const diagram = v(pts);
        const polygons = diagram.polygons();
        pts = polygons.map(poly => poly && polygonCentroid(poly));
    }

    // ctx.strokeStyle = "#080"
    // ctx.fillStyle = "#e0e"
    // for (let i = 0; i < pts.length; i++)
    // {
    //     const [x0,y0] = start[i]
    //     const [x1,y1] = pts[i]
    //
    //     ctx.beginPath()
    //     ctx.moveTo(x0,y0)
    //     ctx.lineTo(x1,y1)
    //     ctx.stroke()
    //
    //     ctx.fillRect(x1-1,y1-1,2,2)
    // }

    return pts.filter(p => !!p)
}

const numRandom = 100
const limit = 50

const black = new Color(0,0,0)

function getDarkestColor(palette, limit)
{

    const a = palette.map(c => {
        const color = Color.from(c);
        return {
            color,
            lum: getLuminance(color)
        };
    })

    a.sort((a,b) => a.lum - b.lum)

    if (a[0].lum < 12000)
    {
        const e = a[0|Math.random() * a.length]

        const result = e.color.mix(black, 0.25);
        console.log("Modified luminance", Math.round(getLuminance(result)))
        return result.toRGBHex()
    }
    console.log("Darkest luminance", Math.round(a[0].lum))

    return a[0].color.toRGBHex();
}


domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;


        function paintRandomPolygon(pts, used, fillFace)
        {
            const numPts = 3 + Math.random() * 10;
            const pick = shuffle(pts.slice()).slice(0, numPts)
            const polygon = concaveman(pick)

            for (let i = 0; i < polygon.length; i++)
            {
                const [x, y] = polygon[i];
                used.add(x + "/" + y)
            }


            ctx.beginPath()
            ctx.moveTo(polygon[0][0], polygon[0][1])
            for (let i = 1; i < polygon.length; i++)
            {
                const [x, y] = polygon[i];
                ctx.lineTo(x, y)
            }
            if (fillFace){
                ctx.fill()
                ctx.stroke()
            }
            else
            {
                ctx.stroke()
            }
        }


        const paint = () => {

            const palette = getRandomPalette();

            const darkestColor = getDarkestColor(palette);

            ctx.fillStyle = darkestColor
            ctx.fillRect(0,0, width, height);


            const used = new Set()
            const pts = getRandomPoints(numRandom)

            do
            {
                const color = palette[0 | Math.random() * palette.length];
                ctx.fillStyle = color
                ctx.lineWidth = 2 + Math.pow(Math.random(), 5) * 9

                const fillFace = Math.random() < 0.25;

                if (fillFace)
                {
                    ctx.fillStyle = Color.from(color).toRGBA(0.1 + Math.random() * 0.8)
                    ctx.strokeStyle = Color.from(color).mix(black, 0.25).toRGBHex()
                }
                else
                {
                    ctx.strokeStyle = color
                }

                paintRandomPolygon(pts, used, fillFace);

            } while (used.size < limit)


        }

        paint()

        canvas.addEventListener("click", paint, true)

    }
);

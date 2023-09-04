import axios, { Axios } from "axios";
import cheerio from "cheerio";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";
import readline from "readline";

const inquirer = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const array = [
  { myId: 1, Region: "centre" },
  { myId: 2, Region: "est" },
  { myId: 3, Region: "extreme-nord" },
  { myId: 4, Region: "littoral" },
  { myId: 5, Region: "nord" },
  { myId: 6, Region: "nord-ouest" },
  { myId: 7, Region: "ouest" },
  { myId: 8, Region: "sud" },
  { myId: 9, Region: "sud-ouest" },
  { myId: 10, Region: "adamoua" },
];

const transformed = array.reduce((acc: any, { myId, ...x }) => {
  acc[myId] = x;
  return acc;
}, {});

console.table(transformed);
interface ICyty {
  index: number;
  pharmacy: string;
  phone: string;
}

inquirer.question("\n\nEnter the region: ", async (region) => {
  const url =
    "https://www.annuaire-medical.cm/fr/pharmacies-de-garde/" + region;
  const cvWriter = createObjectCsvWriter({
    path: "./pharmacy.csv",
    header: [
      { id: "index", title: "Number" },
      { id: "pharmacy", title: "Pharmacy" },
      { id: "phone", title: "Phone" },
    ],
  });
  const AxiosInstance = axios.create();
  await AxiosInstance.get(url)
    .then(async (response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      console.log("\n");
      $(".phar_perso > li").each((i, e) => {
        const c = $(e).find("a").text();
        console.log("-> " + c);
      });
      inquirer.question("\n\nEnter the city: ", async (city) => {
        const urlcity =
          "https://www.annuaire-medical.cm/fr/pharmacies-de-garde/" +
          region +
          "/pharmacies-de-garde-" +
          city;
        await AxiosInstance.get(urlcity).then(async (response) => {
          const htmlcity = response.data;
          const $$ = cheerio.load(htmlcity);
          const cities: ICyty[] = [];
          $$(".article").each(async (ii, ee) => {
            const pharmacy = $(ee).find(".ligne_pers > strong").text();
            const phone = $(ee).find(".ligne_pers > span").text();
            pharmacy.length === 0
              ? console.log("")
              : cities.push({ index: ii, pharmacy, phone });
            await cvWriter.writeRecords(cities);
            fs.writeFileSync("./pharmacy.json", JSON.stringify(cities), "utf8");
          });
          console.log(
            "Please open the file pharmacy.json or pharmacy.csv to see the list of pharmacy\n\nGood bye!\n\n"
          );
        });
      });
    })
    .catch(console.error);
});

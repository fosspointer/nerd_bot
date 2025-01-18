import { SlashCommandBuilder, ChannelType, InteractionType, InteractionContextType } from 'discord.js';
import { Command } from '../command';
import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import sharp, { Sharp } from "sharp";
import { OptionList } from 'mathjax-full/js/util/Options';
import { LiteElement } from 'mathjax-full/js/adaptors/lite/Element';
import * as fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function randomIdentifier(): string {
    return crypto.randomBytes(64).toString('base64url');
}

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const mathjax_document = mathjax.document('', {
    InputJax: new TeX({ packages: AllPackages }),
    OutputJax: new SVG({ fontCache: 'local' })
});

const mathjax_options: OptionList = {
    em: 16,
    ex: 8,
    containerWidth: 1280
};

const extension = '.png';

const Latex : Command = {
    data: new SlashCommandBuilder()
        .setName('latex')
        .setContexts(InteractionContextType.PrivateChannel)
		.setDescription('Renders and outputs LaTeX to the chat.')
        .addStringOption(option => 
            option.setName('input')
                .setDescription('Input LaTeX text')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('font-size')
                .setDescription('Set font size in pt')
                .setRequired(false)),

    async execute(interaction, client) {
        const latexToSvg = (math: string, font_size: number): string => {
            const node = mathjax_document.convert(math, mathjax_options);
            const container = adaptor.firstChild(node) as LiteElement;
            adaptor.setStyle(container, 'font-size', font_size + 'pt');
            return adaptor.innerHTML(node);
        };

        const latex = interaction.options.getString('input', true);
        const font_size = interaction.options.getNumber('font-size', false) || 48;
        const svg = Buffer.from(latexToSvg(latex, font_size));
        const buffer = await sharp(svg).flatten({background: '#fff'}).png().toBuffer();
        const relative_filename = path.join('.', 'temp', `${randomIdentifier()}.${extension}`);
        const filename = path.resolve(relative_filename);
        await fs.writeFileSync(filename, buffer);
        await interaction.reply({
            content: "",
            files: [{
                attachment: filename,
                name: `latex${extension}`
              }]
        });
        await fs.unlinkSync(filename);
    }
};

export = Latex;
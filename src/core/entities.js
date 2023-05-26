export class Cav {
    constructor(nick, cosmo, arm, acao) {
        this.nick = nick;
        this.cosmo = cosmo;
        this.arm = arm;
        this.acao = acao;
    }
}

export class Fight {
    constructor(cavA, cavB, local) {
        this.cavA = cavA;
        this.cavB = cavB;
        this.local = local;
    }

    createFightContextMessage() {
        return `
        Elabore uma narração de uma luta resumida de Cavaleiros dos Zodíacos entre dois cavaleiros com vencedor e perdedor.
        O local da luta é ${this.local}.
        
        O primeiro chama-se ${this.cavA.nick} e possui ${this.cavA.cosmo} de quantidade de cosmo.
        O segundo chama-se ${this.cavB.nick} e possui ${this.cavB.cosmo} de cosmo.
        
        Movimentação de ${this.cavA.nick}: ${this.cavA.acao} 
        Movimentação de ${this.cavB.nick}: ${this.cavB.acao}
        `;
    }

}




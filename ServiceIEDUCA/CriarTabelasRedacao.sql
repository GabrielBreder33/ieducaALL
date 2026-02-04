-- Script de Criação/Atualização das Tabelas de Redação
-- Sistema iEduca - Correção de Redações

USE [ServiceIEDUCA]
GO

-- Tabela Principal: RedacaoCorrecoes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoCorrecoes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RedacaoCorrecoes](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [AtividadeExecucaoId] [int] NULL,
        [UserId] [int] NOT NULL,
        [Tema] [nvarchar](500) NOT NULL,
        [TextoRedacao] [nvarchar](max) NULL,
        [NotaZero] [bit] NOT NULL DEFAULT 0,
        [MotivoNotaZero] [nvarchar](500) NULL,
        [NotaTotal] [decimal](5, 2) NOT NULL DEFAULT 0,
        [ResumoFinal] [nvarchar](2000) NULL,
        [VersaoReescrita] [nvarchar](max) NULL,
        [ConfiancaAvaliacao] [decimal](5, 2) NULL,
        [CriadoEm] [datetime] NULL DEFAULT GETDATE(),
        [AtualizadoEm] [datetime] NULL,
        [Status] [nvarchar](50) NULL DEFAULT 'Processando',
        [Progresso] [int] NOT NULL DEFAULT 0,
        [TipoAvaliacao] [nvarchar](30) NULL DEFAULT 'ENEM',
        CONSTRAINT [PK_RedacaoCorrecoes] PRIMARY KEY CLUSTERED ([Id] ASC)
    )
END
GO

-- Adicionar colunas que podem estar faltando
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoCorrecoes]') AND name = 'MotivoNotaZero')
BEGIN
    ALTER TABLE [dbo].[RedacaoCorrecoes] ADD [MotivoNotaZero] [nvarchar](500) NULL
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoCorrecoes]') AND name = 'VersaoReescrita')
BEGIN
    ALTER TABLE [dbo].[RedacaoCorrecoes] ADD [VersaoReescrita] [nvarchar](max) NULL
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoCorrecoes]') AND name = 'AtualizadoEm')
BEGIN
    ALTER TABLE [dbo].[RedacaoCorrecoes] ADD [AtualizadoEm] [datetime] NULL
END
GO

-- Tabela: RedacaoCompetencias
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoCompetencias]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RedacaoCompetencias](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RedacaoCorrecaoId] [int] NOT NULL,
        [NumeroCompetencia] [int] NOT NULL,
        [NomeCompetencia] [nvarchar](200) NOT NULL,
        [Nota] [int] NOT NULL,
        [Comentario] [nvarchar](1000) NULL,
        [Evidencias] [nvarchar](max) NULL,
        [Melhorias] [nvarchar](max) NULL,
        [CriadoEm] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_RedacaoCompetencias] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_RedacaoCompetencias_RedacaoCorrecoes] FOREIGN KEY([RedacaoCorrecaoId])
            REFERENCES [dbo].[RedacaoCorrecoes] ([Id]) ON DELETE CASCADE
    )
END
GO

-- Tabela: RedacaoErrosGramaticais
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoErrosGramaticais]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RedacaoErrosGramaticais](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RedacaoCorrecaoId] [int] NOT NULL,
        [PosicaoInicio] [int] NOT NULL,
        [PosicaoFim] [int] NOT NULL,
        [TextoOriginal] [nvarchar](500) NULL,
        [TextoSugerido] [nvarchar](500) NULL,
        [Explicacao] [nvarchar](1000) NULL,
        [Severidade] [nvarchar](20) NULL,
        [CriadoEm] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_RedacaoErrosGramaticais] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_RedacaoErrosGramaticais_RedacaoCorrecoes] FOREIGN KEY([RedacaoCorrecaoId])
            REFERENCES [dbo].[RedacaoCorrecoes] ([Id]) ON DELETE CASCADE
    )
END
GO

-- Tabela: RedacaoFeedbacks
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoFeedbacks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RedacaoFeedbacks](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RedacaoCorrecaoId] [int] NOT NULL,
        [Tipo] [nvarchar](20) NOT NULL,
        [Conteudo] [nvarchar](1000) NULL,
        [Ordem] [int] NOT NULL,
        [CriadoEm] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_RedacaoFeedbacks] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_RedacaoFeedbacks_RedacaoCorrecoes] FOREIGN KEY([RedacaoCorrecaoId])
            REFERENCES [dbo].[RedacaoCorrecoes] ([Id]) ON DELETE CASCADE
    )
END
GO

-- Tabela: RedacaoPropostaIntervencao
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RedacaoPropostaIntervencao]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[RedacaoPropostaIntervencao](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [RedacaoCorrecaoId] [int] NOT NULL,
        [Avaliacao] [nvarchar](2000) NULL,
        [SugestoesConcretas] [nvarchar](max) NULL,
        [CriadoEm] [datetime] NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_RedacaoPropostaIntervencao] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [FK_RedacaoPropostaIntervencao_RedacaoCorrecoes] FOREIGN KEY([RedacaoCorrecaoId])
            REFERENCES [dbo].[RedacaoCorrecoes] ([Id]) ON DELETE CASCADE
    )
END
GO

-- Criar índices para melhorar performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoCorrecoes_UserId' AND object_id = OBJECT_ID('dbo.RedacaoCorrecoes'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoCorrecoes_UserId] ON [dbo].[RedacaoCorrecoes] ([UserId])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoCorrecoes_Status' AND object_id = OBJECT_ID('dbo.RedacaoCorrecoes'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoCorrecoes_Status] ON [dbo].[RedacaoCorrecoes] ([Status])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoCorrecoes_CriadoEm' AND object_id = OBJECT_ID('dbo.RedacaoCorrecoes'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoCorrecoes_CriadoEm] ON [dbo].[RedacaoCorrecoes] ([CriadoEm] DESC)
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoCompetencias_RedacaoCorrecaoId' AND object_id = OBJECT_ID('dbo.RedacaoCompetencias'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoCompetencias_RedacaoCorrecaoId] ON [dbo].[RedacaoCompetencias] ([RedacaoCorrecaoId])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoErrosGramaticais_RedacaoCorrecaoId' AND object_id = OBJECT_ID('dbo.RedacaoErrosGramaticais'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoErrosGramaticais_RedacaoCorrecaoId] ON [dbo].[RedacaoErrosGramaticais] ([RedacaoCorrecaoId])
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RedacaoFeedbacks_RedacaoCorrecaoId' AND object_id = OBJECT_ID('dbo.RedacaoFeedbacks'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RedacaoFeedbacks_RedacaoCorrecaoId] ON [dbo].[RedacaoFeedbacks] ([RedacaoCorrecaoId])
END
GO

PRINT 'Tabelas de Redação criadas/atualizadas com sucesso!'
GO

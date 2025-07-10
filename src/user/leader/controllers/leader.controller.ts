import { Body, Controller, Post } from '@nestjs/common';
import { LeaderEvaluationDto } from '../dto/leader-evaluation.dto';
import { LeaderService } from '../services/leader.service';
import { OnlyLeader } from 'src/auth/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ApiBody } from '@nestjs/swagger';
import { exampleLeaderEvaluation } from 'src/common/decorators/post-bodies.examples';

@ApiAuth()
@OnlyLeader()
@Controller('leader')
export class LeaderController {
    constructor(private readonly leaderService: LeaderService) {}

    @Post('evaluate')
    @ApiBody({ schema: { example: exampleLeaderEvaluation } })
    async evaluate(@Body() dto: LeaderEvaluationDto) {
        return this.leaderService.evaluate(dto);
    }
}
